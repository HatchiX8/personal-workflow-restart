import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildReferenceRolePlan,
  preflightReferencePipeline,
  resolveContexts,
  resolveResourcePath,
  runReferencePipeline,
  validateRegistrySnapshot,
  verifyExecutor
} from './reference-pipeline.mjs';
import { checkRuntimeCliIntegration } from './runtime-cli-validation.mjs';
import { runSixScenarioAcceptance } from './runtime-six-scenario-acceptance.mjs';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const workflowRoot = path.resolve(testsDir, '..');
const projectRoot = path.resolve(workflowRoot, '..');
const failures = [];
const notes = [];

const jsonFiles = new Map();
const readText = (relativePath, required = true) => {
  const absolutePath = path.resolve(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    if (required) failures.push(`Missing file: ${relativePath}`);
    return null;
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

const readWorkflowText = (relativePath, required = true) => readText(path.join('AI-Workflow', relativePath), required);

const readJson = (relativePath, required = true) => {
  if (jsonFiles.has(relativePath)) return jsonFiles.get(relativePath);
  const content = readText(relativePath, required);
  if (content === null) return null;
  try {
    const value = JSON.parse(content);
    jsonFiles.set(relativePath, value);
    return value;
  } catch (error) {
    failures.push(`Invalid JSON: ${relativePath} (${error.message})`);
    return null;
  }
};

const readWorkflowJson = (relativePath, required = true) => readJson(path.join('AI-Workflow', relativePath), required);
const existsWithin = (base, relativePath) => {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) return false;
  const resolved = path.resolve(base, relativePath);
  return resolved === base || resolved.startsWith(`${base}${path.sep}`);
};
const workflowPathExists = (relativePath) => existsWithin(workflowRoot, relativePath) && fs.existsSync(path.resolve(workflowRoot, relativePath));
const projectPathExists = (relativePath) => existsWithin(projectRoot, relativePath) && fs.existsSync(path.resolve(projectRoot, relativePath));
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);
const arrayOfStrings = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const unique = (items) => new Set(items).size === items.length;
const stableJson = (value) => JSON.stringify(value, Object.keys(value).sort());
const sha256 = (value) => `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
const parseSemver = (value) => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(value ?? '');
  return match ? match.slice(1).map(Number) : null;
};
const compareSemver = (left, right) => {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
};

function walkJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(current));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(current);
  }
  return files;
}

function checkAllJsonParses() {
  const projectConfigPath = path.join(projectRoot, 'project.config.json');
  const jsonPaths = [
    ...walkJsonFiles(workflowRoot),
    ...walkJsonFiles(path.join(projectRoot, '.ai-workflow')),
    ...(fs.existsSync(projectConfigPath) ? [projectConfigPath] : [])
  ];
  for (const absolutePath of jsonPaths) {
    const relativePath = path.relative(projectRoot, absolutePath);
    readJson(relativePath);
  }
  notes.push(`JSON parse checked: ${jsonFiles.size} files`);
}

function checkConfigReferences() {
  const workflowConfig = readWorkflowJson('workflow.config.json');
  const projectConfig = readJson('project.config.json');
  const projectConfigSchema = readWorkflowJson('schemas/project-config.schema.json');
  if (!workflowConfig || !projectConfig || !projectConfigSchema) return;

  const workflowReferences = [
    ['bootstrap', workflowConfig.bootstrap],
    ...Object.entries(workflowConfig.orchestration ?? {}),
    ...Object.entries(workflowConfig.registries ?? {}),
    ...Object.entries(workflowConfig.schemas ?? {})
  ];
  for (const [name, relativePath] of workflowReferences) {
    assert(existsWithin(workflowRoot, relativePath), `Config path escapes Workflow Root: ${name}=${relativePath}`);
    assert(workflowPathExists(relativePath), `Config reference does not exist: ${name}=${relativePath}`);
  }
  assert(!hasOwn(workflowConfig.registries, 'legacy_aliases'), 'Workflow Config must not register legacy Prompt aliases.');
  assert(!hasOwn(workflowConfig, 'compatibility'), 'Integrated Workflow must not expose a legacy compatibility block.');

  const projectReferences = [
    ['project_root', projectConfig.project_root],
    ...(typeof projectConfig.module_registry === 'string' ? [['module_registry', projectConfig.module_registry]] : []),
    ...((projectConfig.project_contexts ?? []).map((item, index) => [
      `project_contexts[${index}]`,
      item?.path
    ]))
  ];
  for (const [name, relativePath] of projectReferences) {
    assert(existsWithin(projectRoot, relativePath), `Config path escapes Project Root: ${name}=${relativePath}`);
    if (name !== 'project_root' && relativePath) {
      assert(projectPathExists(relativePath), `Project config reference does not exist: ${name}=${relativePath}`);
    }
  }
  assert(!hasOwn(projectConfig, 'workflow_root'), 'Project Config must not declare a Workflow Root.');
  assert(projectConfig.project_root === '.', 'Project Config must identify the repository root with project_root=".".');
  assert(projectConfig.$schema === 'https://controlled-agent-workflow.local/schemas/project-config.schema.json', 'Project Config must use the centralized Project Config schema ID.');
  const workflowVersion = parseSemver(workflowConfig.workflow_version);
  const minimumVersion = parseSemver(projectConfig.workflow_compatibility?.minimum_version);
  const maximumMajorVersion = projectConfig.workflow_compatibility?.maximum_major_version;
  assert(Boolean(workflowVersion), 'Workflow Config must use a semantic workflow_version.');
  assert(Boolean(minimumVersion), 'Project Config must declare a semantic minimum Workflow version.');
  assert(Number.isInteger(maximumMajorVersion), 'Project Config must declare maximum_major_version.');
  if (workflowVersion && minimumVersion && Number.isInteger(maximumMajorVersion)) {
    assert(compareSemver(workflowVersion, minimumVersion) >= 0, 'Installed Workflow is older than the Project Config minimum version.');
    assert(workflowVersion[0] <= maximumMajorVersion, 'Installed Workflow major version exceeds the Project Config maximum.');
  }
  assert(!(projectConfig.context_policy?.require_project_context_for ?? []).includes('develop'), 'Routine Develop must not require a Project Context by default.');
  assert(!(projectConfig.context_policy?.require_project_context_for ?? []).includes('review'), 'Routine Review must not require a Project Context by default.');
  assert(!hasOwn(projectConfig.context_policy, 'high_risk_conditions'), 'Current Project Config must not use deprecated context_policy.high_risk_conditions.');
  assert((projectConfig.project_contexts ?? []).every((item) => item && typeof item === 'object' && !Array.isArray(item)), 'Project Context entries must use the structured canonical format.');

  const contextPolicySchema = projectConfigSchema.properties?.context_policy;
  assert(contextPolicySchema?.additionalProperties === false, 'Project Config context_policy schema must reject unknown fields.');
  assert(
    JSON.stringify(projectConfigSchema.$defs?.contextRequiredActions?.items?.enum) === JSON.stringify(['develop', 'review', 'analyze']),
    'Project Config context_policy action lists must use the canonical action vocabulary.'
  );
  assert(
    contextPolicySchema?.properties?.high_risk_conditions?.deprecated === true,
    'Legacy context_policy.high_risk_conditions must remain explicitly deprecated during the 2.x compatibility window.'
  );
}

function checkRuntimeFallbackConsent() {
  const workflowConfig = readWorkflowJson('workflow.config.json');
  const bootstrap = readWorkflowText('bootstrap.md');
  const dispatcher = readWorkflowText('orchestration/dispatcher.md');
  const runtimeDispatch = readWorkflowText('orchestration/runtime-dispatch.md');
  const rolePlanAuthoring = readWorkflowText('orchestration/role-plan-authoring.md');
  const errorInterpretation = readWorkflowText('orchestration/error-interpretation.md');
  const rootReadme = readText('README.md');
  if (!workflowConfig || !bootstrap || !dispatcher || !runtimeDispatch || !rolePlanAuthoring || !errorInterpretation || !rootReadme) return;

  assert(
    workflowConfig.runtime?.fallback === 'user-confirmed-markdown',
    'Runtime fallback policy must require current-user confirmation.'
  );
  assert(
    workflowConfig.runtime?.input === 'request-file-json'
      && workflowConfig.runtime?.request_directory === '.ai-workflow/runtime/requests',
    'Runtime input must use the controlled Project Root request directory.'
  );
  assert(
    /Bootstrap 不得自行啟動 Markdown fallback/.test(bootstrap),
    'Bootstrap must not start Markdown fallback automatically.'
  );
  assert(
    /AWAITING_FALLBACK_CONSENT/.test(dispatcher) && /目前對話中的使用者/.test(dispatcher),
    'Dispatcher must wait for explicit consent from the current user.'
  );
  assert(
    /Agent、子代理或其他自動化回覆都不能代替使用者同意/.test(dispatcher),
    'Dispatcher must reject proxy or automated fallback consent.'
  );
  assert(
    /是否允許本次需求改用 Markdown fallback/.test(runtimeDispatch),
    'Runtime dispatch must ask the user before loading Markdown fallback.'
  );
  assert(
    /--request-file \.ai-workflow\/runtime\/requests\/<task_id>\.json/.test(runtimeDispatch)
      && /`finally` 流程刪除本次 request file/.test(runtimeDispatch),
    'Runtime dispatch must use and clean up a controlled request file.'
  );
  assert(
    /不得將原始需求或 JSON 拼入 shell command/.test(runtimeDispatch)
      && /不得接受絕對或越界路徑/.test(runtimeDispatch),
    'Runtime request-file contract must prohibit shell interpolation and unsafe paths.'
  );
  assert(
    /不得預先讀取完整 Schema、Registry 或 fallback 契約/.test(runtimeDispatch),
    'Runtime dispatch must not preload fallback context before consent.'
  );
  assert(
    /不得只回覆[\s\S]*概括名稱/.test(runtimeDispatch)
      && /`code`、`path` 與 `reason`/.test(runtimeDispatch)
      && /BLOCKED: runtime-diagnostics-invalid/.test(runtimeDispatch),
    'Runtime dispatch must preserve structured blocker diagnostics in user-facing replies.'
  );
  assert(
    workflowConfig.orchestration?.role_plan_authoring === 'orchestration/role-plan-authoring.md'
      && /`facts` 的每一筆都必須是物件/.test(rolePlanAuthoring)
      && /\{"facts": \["target=frontend", "framework=react"\]\}/.test(rolePlanAuthoring),
    'Normal Runtime routing must load a compact Role Plan contract that rejects string facts.'
  );
  assert(
    workflowConfig.orchestration?.error_interpretation === 'orchestration/error-interpretation.md'
      && /user-input-required/.test(errorInterpretation)
      && /workflow-contract-defect/.test(errorInterpretation)
      && /不得把 `blocked`、`invalid` 或 `error` 改成 `ready`/.test(errorInterpretation)
      && /只使用 Runtime Result、[\s\S]*`error_context`/.test(errorInterpretation),
    'Blocked Runtime results must use the bounded LLM error interpretation contract.'
  );
  assert(
    /Agent、子代理、工具、Workflow 設定、宿主預設、過往需求的同意或自動化規則都不得代表使用者回答/.test(runtimeDispatch),
    'Runtime dispatch must prohibit every non-user consent source.'
  );
  assert(
    /必須先詢問是否允許本次改用[\s\S]*Markdown fallback，不能自行同意/.test(rootReadme),
    'README must disclose user-confirmed Markdown fallback behavior.'
  );
  notes.push('Runtime fallback consent contract checked: current-user confirmation required');
}

function checkExecutionSummaryFooter() {
  const reporting = readWorkflowText('policies/result-reporting.md');
  if (!reporting) return;

  assert(
    /## 新版 Workflow 執行摘要（測試）/.test(reporting),
    'Result reporting must define the new-version test summary title.'
  );
  assert(
    /- 任務模式：<runtime\|markdown-fallback>/.test(reporting),
    'Execution summary must expose the actual task mode.'
  );
  assert(
    !/- Token 消耗：/.test(reporting) && /不得加入 Token/.test(reporting),
    'Execution summary must omit token usage.'
  );
  assert(
    /摘要只能包含上述任務模式/.test(reporting) && /摘要必須是完成回覆的最後一個區塊/.test(reporting),
    'Execution summary must remain a task-mode-only final footer.'
  );
  assert(
    /AWAITING_FALLBACK_CONSENT/.test(reporting) && /Bootstrap 健康檢查/.test(reporting),
    'Consent prompts and exact Bootstrap responses must be exempt from the footer.'
  );
  notes.push('New-version execution summary checked: task mode only');
}

function checkUniqueIds(label, items, key) {
  if (!Array.isArray(items)) return;
  const ids = items.map((item) => item?.[key]).filter((item) => typeof item === 'string');
  assert(unique(ids), `Duplicate ${label} IDs detected: ${ids.join(', ')}`);
}

function checkDependencies() {
  const roles = readWorkflowJson('registry/roles.json');
  const skills = readWorkflowJson('registry/skills.json');
  const bundles = readWorkflowJson('registry/rule-bundles.json');
  const modules = readWorkflowJson('registry/modules.json');
  if (!roles || !skills || !bundles || !modules) return;

  checkUniqueIds('role', roles.roles, 'role_id');
  checkUniqueIds('skill', skills.skills, 'skill_id');
  checkUniqueIds('rule', bundles.rules, 'rule_id');
  checkUniqueIds('bundle', bundles.bundles, 'bundle_id');
  checkUniqueIds('module', modules.modules, 'module_id');

  const roleIds = new Set((roles.roles ?? []).map((item) => item.role_id));
  const skillIds = new Set((skills.skills ?? []).map((item) => item.skill_id));
  const skillById = new Map((skills.skills ?? []).map((item) => [item.skill_id, item]));
  const ruleIds = new Set((bundles.rules ?? []).map((item) => item.rule_id));
  const ruleById = new Map((bundles.rules ?? []).map((item) => [item.rule_id, item]));
  const bundleIds = new Set((bundles.bundles ?? []).map((item) => item.bundle_id));
  const knownIds = new Set([...skillIds, ...ruleIds, ...bundleIds]);
  const graph = new Map();

  const addDependencies = (nodeId, dependencies, source) => {
    const deps = Array.isArray(dependencies) ? dependencies : [];
    graph.set(nodeId, deps);
    for (const dependency of deps) {
      assert(knownIds.has(dependency), `Dangling dependency: ${source} -> ${dependency}`);
    }
  };

  for (const role of roles.roles ?? []) {
    for (const bundleId of [...(role.required_bundle_ids ?? []), ...(role.optional_bundle_ids ?? [])]) {
      assert(bundleIds.has(bundleId), `Role ${role.role_id} references missing bundle ${bundleId}`);
    }
    assert(workflowPathExists(role.entry), `Role entry does not exist: ${role.entry}`);
    assert(role.entry === `roles/${role.role_id}/entry.md`, `Role entry is not canonical: ${role.role_id} -> ${role.entry}`);
    assert(workflowPathExists(role.planner), `Role Planner does not exist: ${role.planner}`);
    assert(role.planner === `roles/${role.role_id}/planner.md`, `Role Planner is not canonical: ${role.role_id} -> ${role.planner}`);
    for (const mode of role.modes ?? []) {
      assert(workflowPathExists(mode.entry), `Role mode entry does not exist: ${mode.entry}`);
      assert(mode.entry === `roles/${role.role_id}/modes/${mode.mode_id}/entry.md`, `Role mode entry is not canonical: ${role.role_id}/${mode.mode_id} -> ${mode.entry}`);
    }
  }

  for (const skill of skills.skills ?? []) {
    assert(roleIds.has(skill.role_id), `Skill ${skill.skill_id} references missing role ${skill.role_id}`);
    if (skill.status === 'active') {
      assert(workflowPathExists(skill.path), `Active Skill path does not exist: ${skill.skill_id} -> ${skill.path}`);
    }
    if (skill.status === 'deprecated' || skill.status === 'manual_review' || skill.load_policy === 'manual_review') {
      assert(skill.load_policy === 'manual_review', `Manual-review Skill has an auto-load policy: ${skill.skill_id}`);
      assert(skill.status !== 'active', `Manual-review Skill cannot be active: ${skill.skill_id}`);
    }
    addDependencies(skill.skill_id, skill.dependencies, `skill:${skill.skill_id}`);
    for (const dependencyId of skill.dependencies ?? []) {
      const dependencySkill = skillById.get(dependencyId);
      if (dependencySkill) {
        assert(
          dependencySkill.role_id === skill.role_id,
          `Cross-role Skill dependency: ${skill.skill_id} (${skill.role_id}) -> ${dependencyId} (${dependencySkill.role_id})`
        );
      }
    }
    assert(arrayOfStrings(skill.selectors?.all), `Skill all selectors are invalid: ${skill.skill_id}`);
    assert(arrayOfStrings(skill.selectors?.any), `Skill any selectors are invalid: ${skill.skill_id}`);
    assert(arrayOfStrings(skill.selectors?.none), `Skill none selectors are invalid: ${skill.skill_id}`);
    assert(Number.isInteger(skill.precedence?.rank), `Skill precedence is missing: ${skill.skill_id}`);
    assert(workflowPathExists(skill.manifest_path), `Skill Manifest does not exist: ${skill.skill_id}`);
  }

  for (const rule of bundles.rules ?? []) {
    if (rule.status === 'active') {
      assert(workflowPathExists(rule.path), `Active Rule path does not exist: ${rule.rule_id} -> ${rule.path}`);
    }
    if (rule.load_policy === 'manual_review' || rule.status === 'manual_review' || rule.status === 'legacy') {
      assert(rule.required !== true, `Manual-review/legacy Rule cannot be required: ${rule.rule_id}`);
    }
    addDependencies(rule.rule_id, rule.dependencies, `rule:${rule.rule_id}`);
    assert(['any', 'all', undefined].includes(rule.trigger_mode), `Invalid Rule trigger mode: ${rule.rule_id}`);
    assert(Number.isInteger(rule.precedence?.rank), `Rule precedence is missing: ${rule.rule_id}`);
    assert(!/(^|\/)readme\.md$/i.test(rule.path), `README cannot be an execution Rule: ${rule.rule_id}`);
    assert(rule.readme_execution_rule !== true, `Execution README metadata is not supported: ${rule.rule_id}`);
  }

  assert(bundles.dependency_contract?.dependencies === 'inclusion only; a selected item recursively includes these IDs', 'Rule dependency semantics must be inclusion-only.');
  assert(bundles.dependency_contract?.precedence === 'conflict arbitration only; it never changes inclusion or load order', 'Rule precedence must not control load order.');
  assert(!ruleById?.get?.('developer.frontend')?.dependencies?.includes('developer.self-review'), 'Frontend Rule must not use self-review as an inclusion dependency.');
  assert(!ruleById?.get?.('developer.backend')?.dependencies?.includes('developer.self-review'), 'Backend Rule must not use self-review as an inclusion dependency.');
  assert(!ruleById?.get?.('developer.python-tool')?.dependencies?.includes('developer.self-review'), 'Python Tool Rule must not use self-review as an inclusion dependency.');
  for (const document of [...(bundles.documentation_files ?? []), ...(skills.documentation_files ?? [])]) {
    assert(document.routable === false, `Documentation README cannot be routable: ${document.path}`);
  }

  for (const bundle of bundles.bundles ?? []) {
    addDependencies(bundle.bundle_id, bundle.dependencies, `bundle:${bundle.bundle_id}`);
    for (const ruleId of bundle.rule_ids ?? []) {
      assert(ruleIds.has(ruleId), `Bundle ${bundle.bundle_id} references missing rule ${ruleId}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (nodeId, trail = []) => {
    if (visiting.has(nodeId)) {
      failures.push(`Dependency cycle detected: ${[...trail, nodeId].join(' -> ')}`);
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    for (const dependency of graph.get(nodeId) ?? []) visit(dependency, [...trail, nodeId]);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  for (const nodeId of graph.keys()) visit(nodeId);
}

function checkRegistrySnapshots() {
  const registryPaths = [
    'registry/roles.json',
    'registry/skills.json',
    'registry/rule-bundles.json',
    'registry/modules.json'
  ];
  for (const registryPath of registryPaths) {
    const registry = readWorkflowJson(registryPath);
    if (!registry) continue;
    assert(['canonical-inventory', 'generated-skill-packages'].includes(registry.source?.type), `Registry uses unsupported inventory metadata: ${registryPath}`);
    assert(Array.isArray(registry.source?.source_paths) && registry.source.source_paths.length > 0, `Registry source paths missing: ${registryPath}`);
    const snapshotPaths = registry.source_snapshot?.files?.map((item) => item.path).sort() ?? [];
    const sourcePaths = [...(registry.source?.source_paths ?? [])].sort();
    assert(JSON.stringify(snapshotPaths) === JSON.stringify(sourcePaths), `Registry snapshot sources do not match source paths: ${registryPath}`);
    for (const error of validateRegistrySnapshot(workflowRoot, registry)) failures.push(error);
  }
}

function checkModuleInvariants() {
  const modules = readWorkflowJson('registry/modules.json');
  if (!modules) return;
  const contextIds = [];
  for (const module of modules.modules ?? []) {
    if (module.module_id === 'lunch') assert(module.aliases?.includes('午餐'), 'Lunch module must register the 午餐 alias.');
    const candidates = module.context_candidates ?? [];
    checkUniqueIds(`context for ${module.module_id}`, candidates, 'context_id');
    for (const candidate of candidates) {
      contextIds.push(candidate.context_id);
      assert(candidate.current !== true || candidate.binding_status === 'bound', `Current Context must be bound: ${candidate.context_id}`);
      assert(candidate.current !== true || candidate.project_id, `Current Context must have a project_id: ${candidate.context_id}`);
      assert(candidate.current !== true || candidate.load_policy !== 'manual_review', `Current Context cannot be manual-review: ${candidate.context_id}`);
      if (candidate.load_policy === 'manual_review' || candidate.binding_status === 'unbound') {
        assert(candidate.current !== true, `Unbound/manual-review Context cannot be current: ${candidate.context_id}`);
      }
    }
    const currentByTarget = new Map();
    for (const candidate of candidates.filter((item) => item.current === true)) {
      const target = candidate.target ?? 'unknown';
      currentByTarget.set(target, (currentByTarget.get(target) ?? 0) + 1);
    }
    for (const [target, count] of currentByTarget) {
      assert(count === 1, `Module ${module.module_id} has ${count} current Contexts for ${target}`);
    }
    const pointer = module.context_selection?.current_context;
    if (pointer === null) {
      assert(candidates.every((candidate) => candidate.current !== true), `Null current pointer has a current candidate: ${module.module_id}`);
      assert(module.context_selection?.auto_resolution === 'blocked', `Unbound module must block auto resolution: ${module.module_id}`);
    } else if (pointer && typeof pointer === 'object') {
      for (const [target, contextId] of Object.entries(pointer)) {
        const current = candidates.find((candidate) => candidate.context_id === contextId && candidate.current === true);
        assert(Boolean(current), `Current pointer does not select a current Context: ${module.module_id}/${target}`);
        assert(current?.target === target, `Current pointer target mismatch: ${module.module_id}/${target}`);
      }
    }
  }
  assert(unique(contextIds), 'Context IDs must be unique across the module registry.');
}

function checkBootstrapAndAdapter() {
  const bootstrap = readWorkflowText('bootstrap.md');
  const adapter = readText('AGENTS.md');
  const healthCheck = readWorkflowText('tests/prompts/bootstrap-health-check.md');
  if (bootstrap !== null) {
    const forbidden = /\b(role|roles|skill|skills|reviewer|frontend|backend|feature|framework)\b|角色|技能|前端|後端|Reviewer|Feature|Framework/i;
    assert(!forbidden.test(bootstrap), 'Bootstrap contains business routing keywords.');
    assert(/does not classify the request|不分類需求/i.test(bootstrap), 'Bootstrap must explicitly state that it does not classify requests.');
    assert(!/Bootstrap\s+(?:starts|begins|executes)\s+(?:the\s+)?(?:task\s+)?execution/i.test(bootstrap), 'Bootstrap must not start execution.');
    assert(/Workflow Root 只有一個權威來源：主機介接規則實際載入的 `bootstrap\.md` 所在目錄/.test(bootstrap), 'Bootstrap must derive Workflow Root from the loaded bootstrap.md.');
    assert(/不得使用 Prompt、環境變數[\s\S]*替代主機介接規則指定的 Workflow Root/.test(bootstrap), 'Bootstrap must reject fallback Workflow Root discovery.');
    assert(/測試 AI Workflow 規則運作/.test(bootstrap), 'Bootstrap health-check Prompt is missing.');
    assert(/必須只回覆：[\s\S]*測試規則運作成功/.test(bootstrap), 'Bootstrap health-check response contract is missing.');
  }
  if (adapter !== null) {
    assert(/^[A-Za-z]:\\[^\r\n]+\\AI-Workflow\\bootstrap\.md$/m.test(adapter), 'Host Adapter must contain one absolute centralized bootstrap.md path.');
    assert(/集中式 Workflow 內的所有後續[\s\S]*都必須相對於 Workflow Root/.test(adapter), 'Host Adapter must require relative internal Workflow paths.');
    assert(/BLOCKED: workflow-bootstrap-unavailable/.test(adapter), 'Host Adapter must fail closed when Bootstrap is unavailable.');
    const forbidden = /角色|技能|Reviewer|Frontend|Backend|Feature|Framework|reviewer|frontend|backend|feature|framework/i;
    assert(!forbidden.test(adapter), 'Host Adapter contains business routing.');
    assert(!/任務類型|task type|skill/i.test(adapter), 'Host Adapter must remain a minimal Bootstrap pointer.');
    const absoluteWorkflowPaths = adapter.match(/[A-Za-z]:\\[^\r\n`]+/g) ?? [];
    assert(absoluteWorkflowPaths.length === 1, 'Host Adapter must contain exactly one absolute Workflow path.');
  }
  if (healthCheck !== null) {
    const promptMatches = healthCheck.match(/測試 AI Workflow 規則運作/g) ?? [];
    const responseMatches = healthCheck.match(/測試規則運作成功/g) ?? [];
    assert(promptMatches.length === 1, 'Bootstrap health-check document must contain the exact Prompt once.');
    assert(responseMatches.length === 1, 'Bootstrap health-check document must contain the exact response once.');
  }
}

function checkIntegratedInputContract() {
  const taskAnalysis = readWorkflowText('orchestration/task-analysis.md');
  const manifestAuthoring = readWorkflowText('orchestration/task-manifest-authoring.md');
  const commonRules = readWorkflowText('workflow/common.md');
  const manifestSchema = readWorkflowJson('schemas/task-manifest.schema.json');
  if (taskAnalysis !== null) {
    assert(/角色：<role_id>/.test(taskAnalysis), 'Task Analysis must document the canonical Role control field.');
    assert(/Skill：<skill_id>/.test(taskAnalysis), 'Task Analysis must document the canonical Skill control field.');
    assert(/unsupported-prompt-control-field:<field>/.test(taskAnalysis), 'Task Analysis must block unsupported structured routing controls.');
    assert(!/legacy-aliases|legacy input|legacy-default/i.test(taskAnalysis), 'Task Analysis still references legacy Prompt normalization.');
  }
  const provenanceSources = manifestSchema?.$defs?.provenance?.properties?.source?.enum
    ?? manifestSchema?.$defs?.provenanceEntry?.properties?.source?.enum
    ?? [];
  assert(!provenanceSources.includes('legacy-default'), 'Task Manifest provenance must not allow legacy-default.');
  assert(
    manifestSchema?.properties?.project?.properties?.project_root?.const === '.',
    'Task Manifest project.project_root must be fixed to the Project Root-relative value ".".'
  );
  if (manifestAuthoring !== null) {
    assert(/`task_manifest\.project\.project_root`[\s\S]*必須固定為 `\.`/.test(manifestAuthoring), 'Task Manifest authoring must distinguish the relative manifest root from the canonical Runtime Request root.');
  }
  assert(!fs.existsSync(path.join(workflowRoot, 'registry', 'legacy-aliases.json')), 'Legacy Prompt alias Registry must be removed.');
  if (commonRules !== null) assert(/固定輸入/.test(commonRules), 'Common Rules must preserve frozen workflow inputs.');
}

function validateManifest(value, label) {
  const errors = [];
  const required = [
    'schema_version', 'task_id', 'created_at', 'raw_request', 'action', 'task_type', 'role_id',
    'skill_ids', 'targets', 'target_mode', 'project', 'modules', 'scope', 'routing_triggers',
    'review_mode', 'analysis_mode', 'provenance', 'unresolved', 'status'
  ];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${label}: not an object`];
  for (const key of required) if (!hasOwn(value, key)) errors.push(`${label}: missing ${key}`);
  if (value.schema_version !== '1.0') errors.push(`${label}: invalid schema_version`);
  if (!['develop', 'review', 'analyze', 'unknown'].includes(value.action)) errors.push(`${label}: invalid action`);
  if (!['feature', 'change', 'bugfix', 'refactor', 'migration', 'maintenance', 'analysis', 'unknown'].includes(value.task_type)) errors.push(`${label}: invalid task_type`);
  if (value.role_id !== null && typeof value.role_id !== 'string') errors.push(`${label}: invalid role_id`);
  if (!arrayOfStrings(value.skill_ids) || !unique(value.skill_ids)) errors.push(`${label}: invalid skill_ids`);
  const targets = ['frontend', 'backend', 'database', 'tooling', 'docs'];
  if (!Array.isArray(value.targets) || !value.targets.every((target) => targets.includes(target)) || !unique(value.targets)) errors.push(`${label}: invalid targets`);
  if (!['single', 'fullstack', 'mixed', 'unknown'].includes(value.target_mode)) errors.push(`${label}: invalid target_mode`);
  if (!value.project || typeof value.project !== 'object' || !['project_id', 'project_root', 'config_path'].every((key) => hasOwn(value.project, key))) errors.push(`${label}: invalid project`);
  else if (value.project.project_root !== '.') errors.push(`${label}: invalid project_root`);
  if (!Array.isArray(value.modules)) errors.push(`${label}: invalid modules`);
  if (!value.scope || !['summary', 'include_paths', 'exclude_paths', 'change_source'].every((key) => hasOwn(value.scope, key))) errors.push(`${label}: invalid scope`);
  if (!arrayOfStrings(value.routing_triggers) || !unique(value.routing_triggers)) errors.push(`${label}: invalid routing_triggers`);
  if (!['change', 'feature', null].includes(value.review_mode)) errors.push(`${label}: invalid review_mode`);
  if (!['project', 'module', null].includes(value.analysis_mode)) errors.push(`${label}: invalid analysis_mode`);
  if (!['analyzed', 'needs-resolution'].includes(value.status)) errors.push(`${label}: invalid status`);
  if (!value.provenance || typeof value.provenance !== 'object') errors.push(`${label}: invalid provenance`);
  if (!arrayOfStrings(value.unresolved)) errors.push(`${label}: invalid unresolved`);
  return errors;
}

function checkRuntimeFixtures() {
  const valid = readWorkflowJson('tests/fixtures/runtime/valid-task-manifest.json');
  const invalid = readWorkflowJson('tests/fixtures/runtime/invalid-task-manifest.json');
  assert(validateManifest(valid, 'valid-task-manifest').length === 0, 'Valid Task Manifest fixture must pass validation.');
  assert(validateManifest(invalid, 'invalid-task-manifest').length > 0, 'Invalid Task Manifest fixture must fail validation.');
}

function checkSixScenarioRuntimeAcceptance() {
  try {
    const results = runSixScenarioAcceptance();
    assert(results.length === 6, 'Six-scenario Runtime acceptance must return exactly six results.');
    notes.push('Runtime end-to-end acceptance checked: Developer/Review across L1, L2, and L3');
  } catch (error) {
    failures.push(`Six-scenario Runtime acceptance failed: ${error.message}`);
  }
}

function checkTaskRiskPolicy() {
  const policy = readWorkflowJson('policies/task-risk-policy.json');
  const schema = readWorkflowJson('schemas/task-risk.schema.json');
  if (!policy || !schema) return;

  const schemaTriggers = [...(schema.$defs?.hardTrigger?.enum ?? [])].sort();
  const policyTriggers = [...(policy.hard_triggers ?? [])].sort();
  assert(
    JSON.stringify(policyTriggers) === JSON.stringify(schemaTriggers),
    'Task Risk Policy hard triggers must exactly match task-risk.schema.json.'
  );

  const knownTriggers = new Set(schemaTriggers);
  for (const [alias, trigger] of Object.entries(policy.trigger_aliases ?? {})) {
    assert(alias.length > 0 && knownTriggers.has(trigger), `Task Risk Policy alias points to an unknown trigger: ${alias} -> ${trigger}`);
  }
  for (const [source, mapping] of Object.entries(policy.derived_hard_triggers ?? {})) {
    for (const [value, trigger] of Object.entries(mapping ?? {})) {
      assert(value.length > 0 && knownTriggers.has(trigger), `Task Risk Policy derived trigger is invalid: ${source}.${value} -> ${trigger}`);
    }
  }
  assert(policy.default_level === 2, 'Task Risk Policy default level must remain conservative Level 2.');
}

function checkPhase3Fixtures() {
  const fixtureDir = path.join(workflowRoot, 'tests', 'fixtures', 'phase-3');
  const expectedDir = path.join(workflowRoot, 'tests', 'expected', 'phase-3');
  const roles = readWorkflowJson('registry/roles.json');
  for (const file of fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.request.json'))) {
    const scenario = readJson(path.join('AI-Workflow', 'tests', 'fixtures', 'phase-3', file));
    const id = file.replace('.request.json', '');
    const manifest = readJson(path.join('AI-Workflow', 'tests', 'expected', 'phase-3', `${id}.task-manifest.json`));
    const selection = readJson(path.join('AI-Workflow', 'tests', 'expected', 'phase-3', `${id}.rule-selection.json`), false);
    const preflight = readJson(path.join('AI-Workflow', 'tests', 'expected', 'phase-3', `${id}.preflight-result.json`), false);
    assert(scenario?.scenario_id === id, `Phase 3 fixture scenario mismatch: ${id}`);
    assert(manifest?.scenario_id === id || manifest?.task_id?.includes(id), `Phase 3 manifest scenario mismatch: ${id}`);
    assert(validateManifest(manifest, `Phase 3 manifest ${id}`).length === 0, `Phase 3 manifest is invalid: ${id}`);
    if (selection) {
      assert(selection.scenario_id === id, `Phase 3 selection scenario mismatch: ${id}`);
      validateSelection(selection, id);
    }
    if (preflight) {
      assert(preflight.scenario_id === id || preflight.task_id === manifest?.task_id, `Phase 3 Preflight scenario mismatch: ${id}`);
      assert(preflight.task_id === manifest?.task_id, `Phase 3 Preflight Task ID mismatch: ${id}`);
      assert(['PASS', 'PASS_WITH_WARNINGS', 'BLOCKED'].includes(preflight.status), `Phase 3 invalid Preflight status: ${id}`);
      assert(preflight.can_execute === (preflight.status !== 'BLOCKED'), `Phase 3 Preflight can_execute mismatch: ${id}`);
      if (preflight.status === 'BLOCKED') {
        assert(preflight.execution_contract === null, `Phase 3 blocked Preflight must not expose an execution contract: ${id}`);
        assert((preflight.blockers ?? []).length > 0, `Phase 3 blocked Preflight needs a blocker: ${id}`);
      } else {
        assert(preflight.execution_contract && typeof preflight.execution_contract === 'object', `Phase 3 passing Preflight needs an execution contract: ${id}`);
        const registeredRole = (roles?.roles ?? []).find((item) => item.role_id === manifest?.role_id);
        assert(
          preflight.execution_contract?.executor_entry === registeredRole?.entry,
          `Phase 3 Preflight executor must match the active Role Registry: ${id}`
        );
        assert(
          workflowPathExists(preflight.execution_contract?.executor_entry),
          `Phase 3 Preflight executor path does not exist: ${id}`
        );
        const fingerprint = preflight.execution_contract?.rule_set_fingerprint;
        assert(
          /^sha256:[a-f0-9]{64}$/u.test(fingerprint ?? '') && !/^sha256:([a-f0-9])\1{63}$/u.test(fingerprint ?? ''),
          `Phase 3 Preflight must use a non-placeholder SHA-256 fingerprint: ${id}`
        );
        assert(
          (preflight.execution_contract?.result_reporting?.reasons ?? []).some((reason) =>
            /^task-risk-level:[123]$/u.test(reason) || /^(?:task-risk|risk-fact):/u.test(reason)),
          `Phase 3 Result Reporting must remain traceable to frozen Task Risk: ${id}`
        );

        const actualRun = runReferencePipeline(manifest, { workflowRoot, projectRoot });
        const actualPreflight = preflightReferencePipeline({
          manifest,
          taskRisk: actualRun.taskRisk,
          executionProfile: actualRun.executionProfile,
          rolePlan: actualRun.rolePlan,
          resolution: actualRun.resolution,
          context: actualRun.context,
          roots: { workflowRoot, projectRoot }
        });
        assert(
          fingerprint === actualPreflight.execution_contract?.rule_set_fingerprint,
          `Phase 3 Preflight fingerprint is stale: ${id}; actual=${actualPreflight.execution_contract?.rule_set_fingerprint ?? 'none'}`
        );
        assert(
          JSON.stringify(preflight.execution_contract?.result_reporting) === JSON.stringify(actualPreflight.execution_contract?.result_reporting),
          `Phase 3 Result Reporting contract is stale: ${id}`
        );
      }
    }
  }
  assert(fs.existsSync(expectedDir), 'Phase 3 expected directory must exist.');
}

function validateSelection(selection, scenarioId) {
  const registry = readWorkflowJson('registry/rule-bundles.json');
  const skillRegistry = readWorkflowJson('registry/skills.json');
  const activeRuleIds = new Set((registry?.rules ?? []).filter((rule) => rule.status === 'active').map((rule) => rule.rule_id));
  const activeSkillIds = new Set((skillRegistry?.skills ?? []).filter((skill) => skill.status === 'active').map((skill) => skill.skill_id));
  const selected = selection.selected_rule_ids ?? [];
  assert(unique(selected), `Duplicate selected rules in ${scenarioId}`);
  for (const ruleId of selected) assert(activeRuleIds.has(ruleId) || activeSkillIds.has(ruleId), `Selection ${scenarioId} contains inactive/unknown rule: ${ruleId}`);
  for (const forbidden of selection.forbidden_routing_sources ?? []) {
    assert(!selected.some((ruleId) => ruleId.toLowerCase().includes(path.basename(forbidden, '.md').toLowerCase())), `Selection ${scenarioId} uses forbidden source: ${forbidden}`);
  }
  assert(!selected.some((ruleId) => /readme/i.test(ruleId)), `Selection ${scenarioId} selected a README as a rule.`);
}

function checkPhase4Fixtures() {
  const fixtureDir = path.join(workflowRoot, 'tests', 'fixtures', 'phase-4');
  for (const file of fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.json'))) {
    const fixture = readJson(path.join('AI-Workflow', 'tests', 'fixtures', 'phase-4', file));
    const expected = readJson(path.join('AI-Workflow', 'tests', 'expected', 'phase-4', file));
    assert(fixture?.scenario_id === expected?.scenario_id, `Phase 4 scenario mismatch: ${file}`);
    assert(typeof expected?.status === 'string', `Phase 4 expected status missing: ${file}`);
    if (expected?.status === 'BLOCKED') {
      assert(expected.execution_started === false, `Phase 4 blocked fixture started execution: ${file}`);
      assert(expected.request_classification_performed === false, `Phase 4 blocked fixture classified request: ${file}`);
    }
    if (expected?.status === 'HEALTH_CHECK_PASSED') {
      assert(fixture.raw_request === '測試 AI Workflow 規則運作', `Phase 4 health-check Prompt mismatch: ${file}`);
      assert(expected.response === '測試規則運作成功', `Phase 4 health-check response mismatch: ${file}`);
      assert(expected.dispatcher_started === false, `Phase 4 health-check started Dispatcher: ${file}`);
      assert(expected.execution_started === false, `Phase 4 health-check started execution: ${file}`);
    }
  }
}

function checkPhase5Fixtures() {
  const fixtureDir = path.join(workflowRoot, 'tests', 'fixtures', 'phase-5');
  for (const file of fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.context-input.json'))) {
    const id = file.replace('.context-input.json', '');
    const fixture = readJson(path.join('AI-Workflow', 'tests', 'fixtures', 'phase-5', file));
    const expected = readJson(path.join('AI-Workflow', 'tests', 'expected', 'phase-5', `${id}.context-result.json`));
    assert(fixture?.scenario_id === expected?.scenario_id, `Phase 5 scenario mismatch: ${id}`);
    assert(['RESOLVED', 'RESOLVED_WITH_WARNINGS', 'BLOCKED'].includes(expected?.status), `Phase 5 invalid status: ${id}`);
    const manifest = {
      action: fixture.query?.action,
      task_type: fixture.query?.task_type ?? 'analysis',
      analysis_mode: fixture.query?.analysis_mode ?? null,
      routing_triggers: fixture.query?.risk_facts ?? [],
      targets: fixture.query?.targets ?? [],
      modules: fixture.query?.module_reference ? [{ module_id: fixture.query.module_reference }] : [],
      project: { project_id: fixture.verified_project?.project_id, project_root: '.', config_path: fixture.verified_project?.config_path }
    };
    const syntheticProjectConfig = {
      project_id: fixture.verified_project?.project_id,
      project_contexts: fixture.project_contexts ?? [],
      context_policy: fixture.context_policy ?? {}
    };
    const actual = resolveContexts({
      manifest,
      projectConfig: syntheticProjectConfig,
      modulesRegistry: { modules: fixture.modules ?? [] },
      roots: { workflowRoot, projectRoot }
    });
    const actualStatus = actual.blockers.length ? 'BLOCKED' : actual.warnings.length ? 'RESOLVED_WITH_WARNINGS' : 'RESOLVED';
    assert(actualStatus === expected.status, `Phase 5 reference Context result mismatch: ${id}`);
    assert(JSON.stringify(actual.contexts.map((context) => context.context_id)) === JSON.stringify((expected.contexts ?? []).map((context) => context.context_id)), `Phase 5 selected Context mismatch: ${id}`);
    for (const context of expected?.contexts ?? []) {
      assert(Boolean(context.context_id && context.path_base && context.path && context.reason), `Phase 5 selected Context is incomplete: ${id}`);
      const candidate = [
        ...(fixture.modules ?? []).flatMap((module) => module.context_candidates ?? []),
        ...(fixture.project_contexts ?? [])
      ].find((item) => item.context_id === context.context_id);
      assert(Boolean(candidate), `Phase 5 selected Context is not in input candidates: ${id}/${context.context_id}`);
      assert(candidate?.current === true, `Phase 5 selected Context is not current: ${id}/${context.context_id}`);
      assert((candidate?.project_id ?? fixture.verified_project?.project_id) === context.project_id, `Phase 5 selected Context project mismatch: ${id}/${context.context_id}`);
    }
    if (id.includes('unbound') || id.includes('cross-project')) assert((expected.contexts ?? []).length === 0, `Phase 5 ${id} must not select a Context.`);
    if (id === 'unbound-optional-warning') assert(expected.status === 'RESOLVED_WITH_WARNINGS', `Phase 5 optional unbound Context must only warn: ${id}`);
    if (id === 'required-module-missing-blocked') assert(expected.status === 'BLOCKED', `Phase 5 explicitly required Module Context must block: ${id}`);
  }
}

function checkPhase6RegressionCases() {
  const cases = readWorkflowJson('tests/fixtures/phase-6/regression-cases.json');
  assert(Array.isArray(cases?.cases), 'Phase 6 regression matrix must contain cases.');
  const ids = (cases?.cases ?? []).map((item) => item.scenario_id);
  assert(unique(ids), 'Phase 6 regression scenario IDs must be unique.');
  const requiredIds = [
    'natural-language-develop', 'explicit-role', 'explicit-skill',
    'unsupported-routing-controls', 'unknown-role', 'unknown-skill', 'ambiguous-target-module',
    'review-unknown-target-common-only', 'unbound-context'
  ];
  for (const id of requiredIds) assert(ids.includes(id), `Missing Phase 6 regression case: ${id}`);

  const rules = readWorkflowJson('registry/rule-bundles.json');
  const skills = readWorkflowJson('registry/skills.json');
  const activeRules = new Set((rules?.rules ?? []).filter((rule) => rule.status === 'active').map((rule) => rule.rule_id));
  const activeSkills = new Set((skills?.skills ?? []).filter((skill) => skill.status === 'active').map((skill) => skill.skill_id));
  const activeResources = new Set([...activeRules, ...activeSkills]);
  for (const testCase of cases?.cases ?? []) {
    const expected = testCase.expected ?? {};
    assert(typeof testCase.raw_request === 'string' && testCase.raw_request.length > 0, `Regression case has no raw request: ${testCase.scenario_id}`);
    for (const ruleId of expected.must_include_rule_ids ?? []) assert(activeResources.has(ruleId), `Regression ${testCase.scenario_id} requires unknown/inactive rule ${ruleId}`);
    for (const ruleId of expected.must_exclude_rule_ids ?? []) assert(!activeRules.has(ruleId) || !expected.selected_rule_ids?.includes(ruleId), `Regression ${testCase.scenario_id} auto-loads forbidden rule ${ruleId}`);
    if (expected.explicit_skill_id) assert(activeSkills.has(expected.explicit_skill_id), `Regression ${testCase.scenario_id} explicit Skill is not active: ${expected.explicit_skill_id}`);
    if (expected.preflight_status) assert(['PASS', 'PASS_WITH_WARNINGS', 'BLOCKED'].includes(expected.preflight_status), `Regression ${testCase.scenario_id} has invalid Preflight status`);
    if (expected.must_not_select_context === true) assert(expected.selected_context_ids?.length === 0, `Regression ${testCase.scenario_id} selected a forbidden Context`);
    if (testCase.scenario_id === 'review-unknown-target-common-only') {
      assert(expected.must_include_rule_ids?.includes('review.check.common'), 'Review unknown-target case must include common checks.');
      assert((expected.must_include_rule_ids ?? []).every((ruleId) => !['review.check.frontend', 'review.check.backend'].includes(ruleId)), 'Review unknown-target case must not include target checks.');
    }
    if (testCase.scenario_id === 'unsupported-routing-controls') {
      assert(expected.preflight_status === 'BLOCKED', 'Unsupported Prompt routing controls must be blocked.');
      assert(expected.must_not_accept_structured_routing_fields === true, 'Unsupported Prompt routing controls must not be accepted.');
      assert((expected.unresolved ?? []).every((item) => item.startsWith('unsupported-prompt-control-field:')), 'Unsupported Prompt routing controls need structured unresolved codes.');
    }
  }
}

function checkTaskAnalysisEvidenceFixtures() {
  const fixture = readWorkflowJson('tests/fixtures/phase-8/task-analysis-evidence.json');
  assert(Array.isArray(fixture?.cases), 'Task Analysis evidence fixture must contain cases.');
  for (const testCase of fixture?.cases ?? []) {
    const manifest = readJson(testCase.manifest);
    const expected = testCase.assertions ?? {};
    assert(manifest?.role_id === (expected.role_id ?? manifest?.role_id), `Task Analysis evidence Role mismatch: ${testCase.scenario_id}`);
    if (expected.action) assert(manifest?.action === expected.action, `Task Analysis evidence Action mismatch: ${testCase.scenario_id}`);
    if (expected.task_type) assert(manifest?.task_type === expected.task_type, `Task Analysis evidence task type mismatch: ${testCase.scenario_id}`);
    if (expected.targets) assert(JSON.stringify(manifest?.targets) === JSON.stringify(expected.targets), `Task Analysis evidence Target mismatch: ${testCase.scenario_id}`);
    if (expected.skill_ids) assert(JSON.stringify(manifest?.skill_ids) === JSON.stringify(expected.skill_ids), `Task Analysis evidence Skill mismatch: ${testCase.scenario_id}`);
    if (expected.module_id) assert((manifest?.modules ?? []).some((module) => module.module_id === expected.module_id), `Task Analysis evidence Module mismatch: ${testCase.scenario_id}`);
    for (const [field, assertion] of Object.entries(expected.provenance ?? {})) {
      const provenance = manifest?.provenance?.[field];
      assert(provenance?.source === assertion.source, `Task Analysis provenance source mismatch: ${testCase.scenario_id}/${field}`);
      assert((provenance?.evidence ?? []).some((evidence) => evidence.includes(assertion.evidence_includes)), `Task Analysis provenance evidence mismatch: ${testCase.scenario_id}/${field}`);
    }
  }
}

function checkSkillPackages() {
  const registry = readWorkflowJson('registry/skills.json');
  if (!registry) return;
  const registeredManifests = new Set((registry.skills ?? []).map((skill) => skill.manifest_path));
  const manifestPaths = walkJsonFiles(path.join(workflowRoot, 'roles'))
    .filter((absolutePath) => path.basename(absolutePath) === 'skill.json')
    .map((absolutePath) => path.relative(workflowRoot, absolutePath).replaceAll('\\', '/'))
    .sort();
  assert(
    JSON.stringify([...registeredManifests].sort()) === JSON.stringify(manifestPaths),
    'Skill Registry must contain every role Skill Manifest exactly once.'
  );

  for (const skill of registry.skills ?? []) {
    const manifest = readWorkflowJson(skill.manifest_path);
    if (!manifest) continue;
    const packageRoot = path.posix.dirname(skill.manifest_path);
    const expectedEntry = path.posix.join(packageRoot, manifest.entry);
    assert(skill.path === expectedEntry, `Skill entry mismatch: ${skill.skill_id}`);
    assert(manifest.skill_id === skill.skill_id, `Skill ID drift: ${skill.skill_id}`);
    assert(manifest.role_id === skill.role_id, `Skill Role drift: ${skill.skill_id}`);
    assert(manifest.category === skill.category, `Skill category drift: ${skill.skill_id}`);
    assert(manifest.status === skill.status, `Skill status drift: ${skill.skill_id}`);
    assert(manifest.version === skill.version, `Skill version drift: ${skill.skill_id}`);
    assert(manifest.owner === skill.owner, `Skill owner drift: ${skill.skill_id}`);
    assert(manifest.load_policy === skill.load_policy, `Skill load policy drift: ${skill.skill_id}`);
    assert(JSON.stringify(manifest.selectors) === JSON.stringify(skill.selectors), `Skill selectors drift: ${skill.skill_id}`);
    assert(JSON.stringify(manifest.scopes) === JSON.stringify(skill.scopes), `Skill scopes drift: ${skill.skill_id}`);
    assert(JSON.stringify(manifest.dependencies) === JSON.stringify(skill.dependencies), `Skill dependencies drift: ${skill.skill_id}`);
    assert(JSON.stringify(manifest.conflicts) === JSON.stringify(skill.conflicts), `Skill conflicts drift: ${skill.skill_id}`);
    assert(manifest.precedence === skill.precedence?.rank, `Skill precedence drift: ${skill.skill_id}`);
    assert(manifest.rule_language === 'zh-TW', `Skill rule language must be zh-TW: ${skill.skill_id}`);
    const rules = readWorkflowText(skill.path);
    assert(/[\u3400-\u9fff]/u.test(rules ?? ''), `Skill rules must contain Chinese: ${skill.skill_id}`);
    for (const testPath of manifest.tests ?? []) {
      assert(workflowPathExists(path.posix.join(packageRoot, testPath)), `Skill test does not exist: ${skill.skill_id}/${testPath}`);
    }
  }
  notes.push(`Skill Package checked: ${manifestPaths.length} packages`);
}

function checkRolePlannerCases() {
  const fixture = readWorkflowJson('tests/fixtures/role-planner-cases.json');
  const roles = readWorkflowJson('registry/roles.json');
  assert(Array.isArray(fixture?.cases), 'Role Planner fixture must contain cases.');
  for (const testCase of fixture?.cases ?? []) {
    const manifest = testCase.manifest;
    const role = (roles?.roles ?? []).find((item) => item.role_id === manifest.role_id);
    const taskRisk = {
      task_id: manifest.task_id,
      level: testCase.expected_result_level,
      reasons: [`fixture-risk-level=${testCase.expected_result_level}`],
      status: 'assessed'
    };
    const rolePlan = buildReferenceRolePlan(manifest, role, taskRisk);
    assert(rolePlan.status === 'planned', `Role Planner did not complete: ${testCase.scenario_id}`);
    assert(rolePlan.planner_entry === testCase.expected_planner, `Role Planner entry mismatch: ${testCase.scenario_id}`);
    assert(rolePlan.role_id === manifest.role_id, `Role Plan role mismatch: ${testCase.scenario_id}`);
    assert(rolePlan.action === manifest.action, `Role Plan action mismatch: ${testCase.scenario_id}`);
    for (const selector of testCase.expected_selectors ?? []) {
      assert(rolePlan.skill_selectors.includes(selector), `Role Plan selector missing: ${testCase.scenario_id}/${selector}`);
    }
    assert(
      rolePlan.result_reporting?.minimum_level === testCase.expected_result_level,
      `Role Plan Result Reporting level mismatch: ${testCase.scenario_id}`
    );
    assert(
      rolePlan.result_reporting?.upward_escalation === true && rolePlan.result_reporting?.reasons?.length > 0,
      `Role Plan Result Reporting contract incomplete: ${testCase.scenario_id}`
    );
  }
  notes.push(`Role Planner checked: ${fixture?.cases?.length ?? 0} cases`);
}

function checkReferencePipeline() {
  const manifest = readWorkflowJson('tests/fixtures/phase-8/routine-develop-pass.task-manifest.json');
  const expected = readWorkflowJson('tests/expected/phase-8/routine-develop-pass.pipeline-result.json');
  if (!manifest || !expected) return;
  const roots = { workflowRoot, projectRoot };
  const run = runReferencePipeline(manifest, roots);
  const preflight = preflightReferencePipeline({ manifest, rolePlan: run.rolePlan, resolution: run.resolution, context: run.context, roots });
  assert(preflight.status === expected.preflight_status, 'Reference pipeline Preflight status mismatch.');
  assert(preflight.can_execute === expected.can_execute, 'Reference pipeline can_execute mismatch.');
  assert(JSON.stringify(run.resolution.rules.map((rule) => rule.rule_id)) === JSON.stringify(expected.selected_rule_ids), 'Reference pipeline selected Rule IDs mismatch.');
  assert(JSON.stringify([...run.resolution.rules].sort((left, right) => left.load_order - right.load_order).map((rule) => rule.rule_id)) === JSON.stringify(expected.load_order_rule_ids), 'Reference pipeline load order mismatch.');
  assert(JSON.stringify(run.resolution.contexts.map((context) => context.context_id)) === JSON.stringify(expected.selected_context_ids), 'Reference pipeline selected Context IDs mismatch.');
  assert(expected.require_real_sha256 === true, 'Reference pipeline must require real SHA-256 validation.');
  for (const rule of run.resolution.rules) assert(/^sha256:[a-f0-9]{64}$/.test(rule.content_hash), `Reference pipeline missing real Rule hash: ${rule.rule_id}`);
  for (const context of run.resolution.contexts) assert(/^sha256:[a-f0-9]{64}$/.test(context.content_hash), `Reference pipeline missing real Context hash: ${context.context_id}`);
  assert(/^sha256:[a-f0-9]{64}$/.test(run.resolution.fingerprint), 'Reference pipeline missing real fingerprint.');
  assert(preflight.execution_contract?.rule_set_fingerprint === run.resolution.fingerprint, 'Passing Preflight must expose the frozen Rule Set fingerprint.');
  assert(
    JSON.stringify(preflight.execution_contract?.result_reporting) === JSON.stringify(run.rolePlan.result_reporting),
    'Passing Preflight must freeze the Role Plan Result Reporting contract.'
  );
  const accepted = verifyExecutor({ resolution: run.resolution, preflight, rolePlan: run.rolePlan, roots });
  assert(accepted.accepted === true, `Executor must accept a fresh frozen Rule Set: ${accepted.reason}`);
  const missingReportingPreflight = preflightReferencePipeline({
    manifest,
    resolution: run.resolution,
    context: run.context,
    roots
  });
  assert(
    missingReportingPreflight.status === 'BLOCKED' &&
      missingReportingPreflight.blockers.includes('result-reporting-missing'),
    'Preflight must block a missing Result Reporting contract.'
  );
  const rewrittenReportingPreflight = {
    ...preflight,
    execution_contract: {
      ...preflight.execution_contract,
      result_reporting: {
        minimum_level: 1,
        reasons: ['rewritten-after-preflight'],
        upward_escalation: true
      }
    }
  };
  const reportingMismatch = verifyExecutor({
    resolution: run.resolution,
    preflight: rewrittenReportingPreflight,
    rolePlan: run.rolePlan,
    roots
  });
  assert(
    reportingMismatch.accepted === false && reportingMismatch.reason === 'result-reporting-contract-mismatch',
    'Executor must reject a rewritten Result Reporting contract.'
  );
  const firstRulePath = path.resolve(workflowRoot, run.resolution.rules[0].path);
  const tampered = verifyExecutor({
    resolution: run.resolution,
    preflight,
    rolePlan: run.rolePlan,
    roots,
    readBytes: (absolutePath) => absolutePath === firstRulePath ? Buffer.from('tampered-bytes') : fs.readFileSync(absolutePath)
  });
  assert(tampered.accepted === false && tampered.reason.startsWith('rule-hash-mismatch:'), 'Executor must reject changed Rule bytes.');
  let traversalRejected = false;
  try {
    resolveResourcePath(roots, 'workflow_root', '../outside.md');
  } catch {
    traversalRejected = true;
  }
  assert(traversalRejected, 'Context/Rule resource path traversal must be rejected.');

  const explicitManifest = readWorkflowJson('tests/expected/phase-3/explicit-role-skill.task-manifest.json');
  const explicitRun = runReferencePipeline(explicitManifest, roots);
  const explicitRuleIds = new Set(explicitRun.resolution.rules.map((rule) => rule.rule_id));
  for (const requiredId of [
    'developer.frontend.base',
    'developer.language.typescript'
  ]) {
    assert(explicitRuleIds.has(requiredId), `Explicit Role/Skill pipeline did not select ${requiredId}.`);
  }

  const selectedSkillIds = (runResult) => runResult.resolution.rules
    .filter((rule) => rule.category === 'skill')
    .map((rule) => rule.rule_id)
    .sort();
  const assertRoleSkills = (runResult, roleId, expectedSkillIds, label) => {
    const registrySkills = new Map((runResult.registries.skills.skills ?? []).map((skill) => [skill.skill_id, skill]));
    const actualSkillIds = selectedSkillIds(runResult);
    assert(JSON.stringify(actualSkillIds) === JSON.stringify([...expectedSkillIds].sort()), `${label}: selected Skill IDs mismatch.`);
    for (const skillId of actualSkillIds) {
      assert(registrySkills.get(skillId)?.role_id === roleId, `${label}: cross-role Skill selected: ${skillId}`);
    }
  };

  const developerManifest = {
    ...manifest,
    task_id: 'acceptance-developer-fullstack',
    raw_request: 'Vue TypeScript frontend and Node.js TypeScript backend refactor',
    action: 'develop',
    task_type: 'refactor',
    role_id: 'developer',
    targets: ['frontend', 'backend'],
    target_mode: 'fullstack',
    modules: [],
    routing_triggers: ['framework=vue', 'runtime=node-js', 'language=typescript'],
    review_mode: null,
    analysis_mode: null,
    unresolved: [],
    status: 'analyzed'
  };
  const developerRun = runReferencePipeline(developerManifest, roots);
  const developerPreflight = preflightReferencePipeline({ manifest: developerManifest, rolePlan: developerRun.rolePlan, resolution: developerRun.resolution, context: developerRun.context, roots });
  assertRoleSkills(developerRun, 'developer', [
    'developer.backend.base',
    'developer.frontend.base',
    'developer.frontend.vue',
    'developer.language.typescript',
    'developer.refactor.general',
    'developer.runtime.node-js'
  ], 'Developer fullstack isolation');
  assert(developerPreflight.status === 'PASS' && developerPreflight.can_execute === true, 'Developer fullstack without required Project Context must pass.');
  assert(developerPreflight.execution_contract?.result_reporting?.minimum_level === 3, 'Developer fullstack must use Result Reporting Level 3.');

  const reviewManifest = {
    ...manifest,
    task_id: 'acceptance-review-feature-fullstack',
    raw_request: 'Review completed frontend and backend feature',
    action: 'review',
    task_type: 'feature',
    role_id: 'review',
    targets: ['frontend', 'backend'],
    target_mode: 'fullstack',
    modules: [],
    routing_triggers: ['framework=vue', 'runtime=node-js'],
    review_mode: 'feature',
    analysis_mode: null,
    unresolved: [],
    status: 'analyzed'
  };
  const reviewRun = runReferencePipeline(reviewManifest, roots);
  const reviewPreflight = preflightReferencePipeline({ manifest: reviewManifest, rolePlan: reviewRun.rolePlan, resolution: reviewRun.resolution, context: reviewRun.context, roots });
  assertRoleSkills(reviewRun, 'review', ['review.check.backend', 'review.check.frontend'], 'Review feature isolation');
  assert(reviewPreflight.status === 'PASS' && reviewPreflight.can_execute === true, 'Feature Review fullstack routing must pass.');

  const moduleManifest = {
    ...manifest,
    task_id: 'acceptance-module-analysis-fullstack',
    raw_request: 'Analyze Lunch frontend and backend module',
    action: 'analyze',
    task_type: 'analysis',
    role_id: 'module-analyst',
    targets: ['frontend', 'backend'],
    target_mode: 'fullstack',
    modules: [{ module_id: 'lunch', name: 'Lunch', aliases: ['lunch', '午餐'], candidate_paths: [] }],
    routing_triggers: [],
    review_mode: null,
    analysis_mode: 'module',
    unresolved: [],
    status: 'analyzed'
  };
  const moduleRun = runReferencePipeline(moduleManifest, roots);
  const modulePreflight = preflightReferencePipeline({ manifest: moduleManifest, rolePlan: moduleRun.rolePlan, resolution: moduleRun.resolution, context: moduleRun.context, roots });
  assertRoleSkills(moduleRun, 'module-analyst', ['module-analyst.backend', 'module-analyst.frontend'], 'Module Analyst isolation');
  assert(modulePreflight.status === 'PASS' && modulePreflight.can_execute === true, 'Module Analysis must not consult or warn about an unbound Module Context.');
  assert(moduleRun.resolution.contexts.every((item) => item.type !== 'module'), 'Module Analysis must not load an existing Module Context.');
  assert(!moduleRun.rolePlan.context_requirements.includes('module'), 'Module Analysis Role Plan must not require Module Context.');

  const discoveryManifest = {
    ...moduleManifest,
    task_id: 'acceptance-module-analysis-repository-discovery',
    raw_request: '分析 inventory-v2 模組並自行從陌生專案尋找相關檔案',
    targets: [],
    target_mode: 'unknown',
    modules: [{ module_id: 'inventory-v2', name: 'inventory-v2', aliases: [], candidate_paths: [] }],
    scope: {
      summary: 'Discover the named module from repository evidence without configured paths.',
      include_paths: [],
      exclude_paths: [],
      change_source: 'request'
    },
    provenance: {
      ...moduleManifest.provenance,
      targets: { source: 'inference', confidence: 1, evidence: ['The request does not constrain a Target; use target-neutral discovery.'], candidates: [] },
      modules: { source: 'explicit', confidence: 1, evidence: ['The request names inventory-v2.'], candidates: ['inventory-v2'] },
      scope: { source: 'explicit', confidence: 1, evidence: ['Repository discovery is requested within Project Root.'], candidates: ['module'] }
    }
  };
  const discoveryRun = runReferencePipeline(discoveryManifest, roots);
  const discoveryPreflight = preflightReferencePipeline({ manifest: discoveryManifest, rolePlan: discoveryRun.rolePlan, resolution: discoveryRun.resolution, context: discoveryRun.context, roots });
  assertRoleSkills(discoveryRun, 'module-analyst', [], 'Target-neutral Module Analyst isolation');
  assert(discoveryPreflight.status === 'PASS' && discoveryPreflight.can_execute === true, 'An explicitly named module absent from Registry must pass for repository discovery.');
  assert(discoveryRun.resolution.contexts.every((item) => item.type !== 'module'), 'Repository discovery must start without loading Module Context paths.');

  const incompatibleManifest = {
    ...reviewManifest,
    task_id: 'acceptance-explicit-cross-role-skill',
    skill_ids: ['developer.language.typescript']
  };
  const incompatibleRun = runReferencePipeline(incompatibleManifest, roots);
  const incompatiblePreflight = preflightReferencePipeline({ manifest: incompatibleManifest, rolePlan: incompatibleRun.rolePlan, resolution: incompatibleRun.resolution, context: incompatibleRun.context, roots });
  assert(incompatibleRun.resolution.unresolved.includes('skill-role-incompatible:developer.language.typescript'), 'Explicit cross-role Skill must be unresolved.');
  assert(incompatiblePreflight.status === 'BLOCKED' && incompatiblePreflight.can_execute === false, 'Explicit cross-role Skill must be blocked.');

  const developerSkillRule = developerRun.resolution.rules.find((rule) => rule.rule_id === 'developer.language.typescript');
  const contaminatedResolution = { ...reviewRun.resolution, rules: [...reviewRun.resolution.rules, developerSkillRule] };
  const contaminatedPreflight = preflightReferencePipeline({ manifest: reviewManifest, rolePlan: reviewRun.rolePlan, resolution: contaminatedResolution, context: reviewRun.context, roots });
  assert(contaminatedPreflight.blockers.includes('skill-role-mismatch:developer.language.typescript'), 'Preflight must independently block a cross-role Skill.');
}

function checkGitignore() {
  const gitignore = readText('.gitignore');
  if (gitignore === null) return;
  assert(/\.ai-workflow\/runtime\/?/.test(gitignore) || /AI-Workflow\/runtime\/?/.test(gitignore), '.gitignore must ignore runtime artifacts.');
  assert(!/^\s*project\.config\.json\s*$/m.test(gitignore), '.gitignore must not ignore project.config.json.');
  assert(/agent-workspaces\/reviews\/\*/.test(gitignore), '.gitignore must ignore generated Review reports.');
  assert(/agent-workspaces\/module-context\/\*/.test(gitignore), '.gitignore must ignore generated Module Context files.');
  assert(!/^\s*AI-Workflow\/(?:reviews|module-context)\/?\s*$/m.test(gitignore), '.gitignore must not preserve legacy Workflow output directories.');
}

function checkProjectArtifactPaths() {
  const outputRules = [
    'roles/review/modes/change/report.md',
    'roles/review/modes/feature/report.md',
    'roles/module-analyst/output.md',
    'roles/module-analyst/report.md',
    'roles/project-analyst/output.md'
  ];
  for (const rulePath of outputRules) {
    const content = readWorkflowText(rulePath);
    assert(content?.includes('agent-workspaces/'), `Project artifact path is not under agent-workspaces: ${rulePath}`);
    assert(!content?.includes('AI-Workflow/reviews/'), `Review output still targets Workflow Root: ${rulePath}`);
    assert(!content?.includes('AI-Workflow/module-context/'), `Module output still targets Workflow Root: ${rulePath}`);
  }
  assert(
    readWorkflowText('roles/project-analyst/output.md')?.includes('agent-workspaces/project-analysis/PROJECT_ANALYSIS.md'),
    'Project Analysis output path is not canonical.'
  );
}

function main() {
  checkAllJsonParses();
  checkConfigReferences();
  checkRuntimeFallbackConsent();
  checkExecutionSummaryFooter();
  checkDependencies();
  checkRegistrySnapshots();
  checkModuleInvariants();
  checkBootstrapAndAdapter();
  checkIntegratedInputContract();
  checkRuntimeFixtures();
  checkSixScenarioRuntimeAcceptance();
  checkTaskRiskPolicy();
  checkRuntimeCliIntegration({ workflowRoot, projectRoot, readWorkflowJson, assert, notes });
  checkPhase3Fixtures();
  checkPhase4Fixtures();
  checkPhase5Fixtures();
  checkPhase6RegressionCases();
  checkTaskAnalysisEvidenceFixtures();
  checkSkillPackages();
  checkRolePlannerCases();
  checkReferencePipeline();
  checkGitignore();
  checkProjectArtifactPaths();

  if (failures.length > 0) {
    console.error(`Workflow validation failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('Workflow validation passed.');
  for (const note of notes) console.log(`- ${note}`);
}

main();
