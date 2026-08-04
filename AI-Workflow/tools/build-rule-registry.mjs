import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workflowRoot = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(workflowRoot, 'registry', 'rule-bundles.json');
const checkOnly = process.argv.includes('--check');

const sha256 = (bytes) =>
  `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const rule = (
  ruleId,
  rulePath,
  category,
  roleIds,
  rank,
  dependencies = [],
  triggers = []
) => ({
  rule_id: ruleId,
  path: rulePath,
  category,
  status: 'active',
  load_policy: ruleId === 'bootstrap.entry' ? 'host-entry' : 'required',
  role_ids: roleIds,
  required: true,
  triggers,
  dependencies,
  precedence: {
    source: rulePath,
    rank
  }
});

const modeRule = (mode, name, fileName, category = 'reviewer') =>
  rule(
    `review.${mode}.${name}`,
    `roles/review/modes/${mode}/${fileName}`,
    category,
    ['review'],
    2,
    [],
    [`review_mode=${mode}`]
  );

const bundle = (bundleId, ruleIds, dependencies, source, triggers) => ({
  bundle_id: bundleId,
  status: 'active',
  selection: 'all',
  triggers,
  rule_ids: ruleIds,
  dependencies,
  source
});

const allRoles = ['developer', 'review', 'project-analyst', 'module-analyst'];
const rules = [
  rule('bootstrap.entry', 'bootstrap.md', 'bootstrap', [], 0, [], ['every-task']),
  rule('common.workflow-mode', 'workflow/common.md', 'common', allRoles, 0, [], ['resolved-role']),
  rule('policy.report-file', 'policies/report-file-policy.md', 'common', allRoles, 0),
  rule('policy.result-reporting', 'policies/result-reporting.md', 'common', allRoles, 0),
  rule(
    'policy.analysis-safety',
    'policies/analysis-safety.md',
    'common',
    ['project-analyst', 'module-analyst'],
    0
  ),
  rule(
    'policy.evidence-confidence',
    'policies/evidence-confidence.md',
    'common',
    ['project-analyst', 'module-analyst'],
    0
  ),
  rule(
    'policy.secret-handling',
    'policies/secret-handling.md',
    'common',
    ['project-analyst', 'module-analyst'],
    0
  ),

  rule(
    'developer.entry',
    'roles/developer/entry.md',
    'role',
    ['developer'],
    0,
    ['common.workflow-mode'],
    ['role=developer']
  ),
  rule(
    'developer.restrictions',
    'roles/developer/restrictions.md',
    'role',
    ['developer'],
    1,
    [],
    ['role=developer']
  ),
  rule(
    'developer.core',
    'roles/developer/core.md',
    'role',
    ['developer'],
    4,
    ['developer.restrictions'],
    ['role=developer']
  ),
  rule(
    'developer.workflow',
    'roles/developer/workflow.md',
    'role',
    ['developer'],
    5,
    ['developer.core', 'developer.restrictions'],
    ['role=developer']
  ),
  rule(
    'developer.self-review',
    'roles/developer/validation.md',
    'output',
    ['developer'],
    7,
    ['developer.workflow'],
    ['role=developer']
  ),
  rule(
    'developer.output',
    'roles/developer/output.md',
    'output',
    ['developer'],
    8,
    ['developer.workflow', 'developer.self-review', 'policy.result-reporting'],
    ['role=developer']
  ),

  rule(
    'review.entry',
    'roles/review/entry.md',
    'role',
    ['review'],
    0,
    ['common.workflow-mode'],
    ['role=review']
  ),
  rule(
    'review.workflow',
    'roles/review/workflow.md',
    'reviewer',
    ['review'],
    1,
    [],
    ['role=review']
  ),
  rule(
    'review.restrictions',
    'roles/review/restrictions.md',
    'reviewer',
    ['review'],
    1,
    [],
    ['role=review']
  ),
  rule(
    'review.pass',
    'roles/review/pass-conditions.md',
    'reviewer',
    ['review'],
    3,
    ['review.workflow'],
    ['role=review']
  ),
  rule(
    'review.output',
    'roles/review/output.md',
    'output',
    ['review'],
    4,
    ['review.workflow', 'policy.report-file', 'policy.result-reporting'],
    ['role=review']
  ),
  rule(
    'review.check.common',
    'roles/review/checks/common.md',
    'reviewer',
    ['review'],
    2,
    [],
    ['role=review']
  ),
  modeRule('change', 'entry', 'entry.md'),
  modeRule('change', 'workflow', 'workflow.md'),
  modeRule('change', 'restrictions', 'restrictions.md'),
  modeRule('change', 'report', 'report.md', 'output'),
  modeRule('change', 'pass', 'pass-conditions.md'),
  modeRule('feature', 'entry', 'entry.md'),
  modeRule('feature', 'workflow', 'workflow.md'),
  modeRule('feature', 'restrictions', 'restrictions.md'),
  modeRule('feature', 'report', 'report.md', 'output'),
  modeRule('feature', 'pass', 'pass-conditions.md'),

  rule(
    'project.entry',
    'roles/project-analyst/entry.md',
    'role',
    ['project-analyst'],
    0,
    ['common.workflow-mode'],
    ['role=project-analyst']
  ),
  rule(
    'project.restrictions',
    'roles/project-analyst/restrictions.md',
    'role',
    ['project-analyst'],
    1,
    ['policy.analysis-safety', 'policy.evidence-confidence', 'policy.secret-handling'],
    ['role=project-analyst']
  ),
  rule(
    'project.workflow',
    'roles/project-analyst/workflow.md',
    'role',
    ['project-analyst'],
    2,
    ['project.restrictions'],
    ['role=project-analyst']
  ),
  rule(
    'project.identify',
    'roles/project-analyst/identify-project.md',
    'role',
    ['project-analyst'],
    3,
    ['project.workflow'],
    ['role=project-analyst']
  ),
  rule(
    'project.team-style',
    'roles/project-analyst/team-style.md',
    'role',
    ['project-analyst'],
    4,
    ['project.identify'],
    ['role=project-analyst']
  ),
  rule(
    'project.output',
    'roles/project-analyst/output.md',
    'output',
    ['project-analyst'],
    5,
    ['project.workflow', 'policy.report-file', 'policy.result-reporting'],
    ['role=project-analyst']
  ),

  rule(
    'module.entry',
    'roles/module-analyst/entry.md',
    'role',
    ['module-analyst'],
    0,
    ['common.workflow-mode'],
    ['role=module-analyst']
  ),
  rule(
    'module.restrictions',
    'roles/module-analyst/restrictions.md',
    'role',
    ['module-analyst'],
    1,
    ['policy.analysis-safety', 'policy.evidence-confidence', 'policy.secret-handling'],
    ['role=module-analyst']
  ),
  rule(
    'module.workflow',
    'roles/module-analyst/workflow.md',
    'role',
    ['module-analyst'],
    2,
    ['module.restrictions'],
    ['role=module-analyst']
  ),
  rule(
    'module.output',
    'roles/module-analyst/output.md',
    'output',
    ['module-analyst'],
    5,
    ['module.workflow', 'policy.report-file', 'policy.result-reporting'],
    ['role=module-analyst']
  ),
  rule(
    'module.report',
    'roles/module-analyst/report.md',
    'output',
    ['module-analyst'],
    6,
    ['module.output', 'policy.report-file'],
    ['role=module-analyst']
  )
];

const bundles = [
  bundle(
    'common.workflow-mode',
    ['common.workflow-mode', 'policy.result-reporting'],
    [],
    'workflow/common.md',
    ['resolved-role']
  ),
  bundle(
    'developer.base',
    [
      'developer.entry',
      'developer.restrictions',
      'developer.core',
      'developer.workflow',
      'developer.self-review',
      'developer.output'
    ],
    ['common.workflow-mode'],
    'roles/developer/entry.md',
    ['role=developer']
  ),
  bundle(
    'review.base',
    [
      'review.entry',
      'review.workflow',
      'review.restrictions',
      'review.pass',
      'review.output'
    ],
    ['common.workflow-mode'],
    'roles/review/entry.md',
    ['role=review']
  ),
  bundle(
    'review.common-check',
    ['review.check.common'],
    ['review.base'],
    'roles/review/checks/common.md',
    ['role=review']
  ),
  bundle(
    'review.change',
    [
      'review.change.entry',
      'review.change.workflow',
      'review.change.restrictions',
      'review.change.report',
      'review.change.pass'
    ],
    ['review.common-check'],
    'roles/review/modes/change/entry.md',
    ['review_mode=change']
  ),
  bundle(
    'review.feature',
    [
      'review.feature.entry',
      'review.feature.workflow',
      'review.feature.restrictions',
      'review.feature.report',
      'review.feature.pass'
    ],
    ['review.common-check'],
    'roles/review/modes/feature/entry.md',
    ['review_mode=feature']
  ),
  bundle(
    'project-analyst.base',
    [
      'project.entry',
      'project.restrictions',
      'project.workflow',
      'project.identify',
      'project.team-style',
      'project.output'
    ],
    ['common.workflow-mode'],
    'roles/project-analyst/entry.md',
    ['role=project-analyst']
  ),
  bundle(
    'module-analyst.base',
    [
      'module.entry',
      'module.restrictions',
      'module.workflow',
      'module.output',
      'module.report'
    ],
    ['common.workflow-mode'],
    'roles/module-analyst/entry.md',
    ['role=module-analyst']
  )
];

const sourcePaths = [...new Set(rules.map((item) => item.path))].sort();
for (const sourcePath of sourcePaths) {
  if (!fs.existsSync(path.join(workflowRoot, sourcePath))) {
    throw new Error(`核心規則不存在：${sourcePath}`);
  }
}
const snapshotFiles = sourcePaths.map((sourcePath) => ({
  path: sourcePath,
  kind: 'file',
  content_hash: sha256(fs.readFileSync(path.join(workflowRoot, sourcePath)))
}));

const registry = {
  $schema: '../schemas/registry.schema.json',
  schema_version: '1.0',
  registry_id: 'rule-bundles',
  source: {
    type: 'canonical-inventory',
    inventory_version: '1.0',
    source_paths: sourcePaths
  },
  source_snapshot: {
    algorithm: 'sha256',
    files: snapshotFiles,
    fingerprint: sha256(Buffer.from(stableJson(snapshotFiles)))
  },
  path_contract:
    '所有規則路徑皆相對於 AI-Workflow Root；核心規則只由 Bundle 與相依關係選取，不可猜測檔名。',
  dependency_contract: {
    dependencies: 'inclusion only; a selected item recursively includes these IDs',
    load_order: '以相依圖計算固定載入順序。',
    precedence: 'conflict arbitration only; it never changes inclusion or load order',
    default_trigger_mode: 'any'
  },
  readme_policy: {
    default: 'documentation-only',
    documentation_files_routable: false
  },
  rules,
  bundles,
  documentation_files: [
    { path: 'roles/developer/README.md', status: 'documentation', routable: false },
    { path: 'roles/review/README.md', status: 'documentation', routable: false },
    { path: 'roles/project-analyst/README.md', status: 'documentation', routable: false },
    { path: 'roles/module-analyst/README.md', status: 'documentation', routable: false }
  ],
  unresolved: []
};

const generated = `${JSON.stringify(registry, null, 2)}\n`;
if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== generated) {
    throw new Error(
      'registry/rule-bundles.json 與核心規則不同步，請執行 tools/build-rule-registry.mjs'
    );
  }
  console.log(`核心 Rule Registry 檢查成功：${rules.length} 條規則`);
} else {
  fs.writeFileSync(outputPath, generated, 'utf8');
  console.log(`核心 Rule Registry 已產生：${rules.length} 條規則`);
}
