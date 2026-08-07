import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

import {
  assessTaskRisk,
  buildReferenceRolePlan,
  resolveExecutionProfile
} from './reference-pipeline.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));

function parseSingleJson(stdout) {
  const text = stdout.trim();
  if (text.length === 0) return { parsed: null, error: 'stdout is empty' };
  try {
    return { parsed: JSON.parse(text), error: null };
  } catch (error) {
    return { parsed: null, error: error.message };
  }
}

function runCli(entry, cwd, input) {
  const requestRoot = path.join(cwd, '.ai-workflow', 'runtime', 'requests');
  fs.mkdirSync(requestRoot, { recursive: true });
  const requestDirectory = fs.mkdtempSync(path.join(requestRoot, 'validation-'));
  const requestFile = path.join(requestDirectory, 'request.json');
  fs.writeFileSync(requestFile, typeof input === 'string' ? input : JSON.stringify(input), {
    encoding: 'utf8',
    flag: 'wx'
  });
  let result;
  try {
    result = spawnSync(process.execPath, [entry, '--request-file', path.relative(cwd, requestFile)], {
      cwd,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
      timeout: 15_000
    });
  } finally {
    fs.rmSync(requestDirectory, { recursive: true, force: true });
  }
  const stdout = result.stdout ?? '';
  const parsed = parseSingleJson(stdout);
  return {
    exitCode: result.status,
    signal: result.signal,
    error: result.error,
    stderr: result.stderr ?? '',
    stdout,
    json: parsed.parsed,
    parseError: parsed.error
  };
}

function isSafeRelativePath(relativePath) {
  return typeof relativePath === 'string'
    && relativePath.length > 0
    && !path.isAbsolute(relativePath)
    && !relativePath.split(/[\\/]/u).includes('..');
}

function snapshotDirectory(directory) {
  const records = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      const relativePath = path.relative(directory, absolutePath).replaceAll('\\', '/');
      if (entry.isDirectory()) walk(absolutePath);
      else if (entry.isFile()) {
        records.push({
          path: relativePath,
          bytes: fs.readFileSync(absolutePath).toString('base64')
        });
      }
    }
  };
  walk(directory);
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

export function checkRuntimeCliIntegration({
  workflowRoot,
  projectRoot,
  readWorkflowJson,
  assert,
  notes
}) {
  const entry = path.join(workflowRoot, 'runtime', 'resolve-task.mjs');
  const manifest = readWorkflowJson('tests/fixtures/phase-8/routine-develop-pass.task-manifest.json');
  const roles = readWorkflowJson('registry/roles.json');
  const skills = readWorkflowJson('registry/skills.json');
  const policy = readWorkflowJson('policies/task-risk-policy.json');
  if (!manifest || !roles || !skills || !policy || !fs.existsSync(entry)) return;

  const role = (roles.roles ?? []).find((item) => item.role_id === manifest.role_id);
  const initialTaskRisk = assessTaskRisk(manifest, policy);
  const rolePlan = buildReferenceRolePlan(manifest, role, initialTaskRisk);
  const routingRequest = {
    protocol_version: '1.0',
    operation: 'resolve-routing',
    project_root: '.',
    task_manifest: manifest
  };
  const executionRequest = {
    ...routingRequest,
    operation: 'resolve-execution',
    role_plan: rolePlan
  };

  const routing = runCli(entry, projectRoot, routingRequest);
  assert(!routing.error && routing.signal === null, `Runtime routing CLI failed to launch: ${routing.error?.message ?? routing.signal}`);
  assert(routing.parseError === null, `Runtime routing stdout must be one valid JSON value: ${routing.parseError}`);
  assert(routing.exitCode === 0, `Runtime routing must exit 0, received ${routing.exitCode}: ${routing.stderr.trim()}`);
  assert(routing.json?.status === 'resolved', 'Runtime routing must return status=resolved.');
  assert(routing.json?.operation === 'resolve-routing', 'Runtime routing result operation mismatch.');
  assert(routing.json?.task_id === manifest.task_id, 'Runtime routing result Task ID mismatch.');
  assert(routing.json?.next?.stage === 'role-planner', 'Runtime routing must advance to role-planner.');
  assert(
    JSON.stringify(routing.json?.next?.load_paths) === JSON.stringify(['orchestration/role-plan-authoring.md', role.planner]),
    'Runtime routing must return the compact Role Plan contract followed by the selected canonical Role Planner path.'
  );

  const execution = runCli(entry, projectRoot, executionRequest);
  assert(!execution.error && execution.signal === null, `Runtime execution CLI failed to launch: ${execution.error?.message ?? execution.signal}`);
  assert(execution.parseError === null, `Runtime execution stdout must be one valid JSON value: ${execution.parseError}`);
  assert(execution.exitCode === 0, `Runtime execution must exit 0, received ${execution.exitCode}: ${execution.stderr.trim()}`);
  assert(execution.json?.status === 'ready', 'Runtime execution must return status=ready.');
  assert(execution.json?.operation === 'resolve-execution', 'Runtime execution result operation mismatch.');
  assert(execution.json?.task_id === manifest.task_id, 'Runtime execution result Task ID mismatch.');
  assert(execution.json?.preflight?.can_execute === true, 'Runtime execution must pass Preflight.');
  assert(execution.json?.execution_contract?.rule_set_fingerprint === execution.json?.fingerprint, 'Runtime execution must freeze the returned fingerprint.');
  assert(
    JSON.stringify(execution.json?.execution_contract?.result_reporting) === JSON.stringify({
      minimum_level: initialTaskRisk.level,
      reasons: [`task-risk-level:${initialTaskRisk.level}`],
      upward_escalation: true
    }),
    'Reference Role Plan Result Reporting must use the frozen Task Risk as its only classification baseline.'
  );

  const developerAnalyzeManifest = clone(manifest);
  developerAnalyzeManifest.task_id = 'runtime-developer-readonly-analysis';
  developerAnalyzeManifest.raw_request = '分析首頁按鈕的既有資料流與元件責任。';
  developerAnalyzeManifest.action = 'analyze';
  developerAnalyzeManifest.task_type = 'analysis';
  developerAnalyzeManifest.analysis_mode = null;
  developerAnalyzeManifest.provenance.action = { source: 'explicit', confidence: 1, evidence: ['唯讀分析'], candidates: ['analyze'] };
  developerAnalyzeManifest.provenance.task_type = { source: 'explicit', confidence: 1, evidence: ['既有功能分析'], candidates: ['analysis'] };
  developerAnalyzeManifest.provenance.role_id = { source: 'inference', confidence: 1, evidence: ['一般功能分析使用 Developer'], candidates: ['developer'] };
  const developerAnalyzeRisk = assessTaskRisk(developerAnalyzeManifest, policy);
  const developerAnalyzePlan = buildReferenceRolePlan(developerAnalyzeManifest, role, developerAnalyzeRisk);
  const developerAnalyzeRouting = runCli(entry, projectRoot, { ...routingRequest, task_manifest: developerAnalyzeManifest });
  const developerAnalyzeExecution = runCli(entry, projectRoot, {
    ...executionRequest,
    task_manifest: developerAnalyzeManifest,
    role_plan: developerAnalyzePlan
  });
  assert(developerAnalyzeRouting.exitCode === 0 && developerAnalyzeRouting.json?.status === 'resolved', 'Developer read-only analysis must resolve without a separate analysis Role.');
  assert(developerAnalyzeExecution.exitCode === 0 && developerAnalyzeExecution.json?.status === 'ready', 'Developer read-only analysis must pass Runtime execution.');
  assert(developerAnalyzeExecution.json?.execution_contract?.allowed_action === 'analyze', 'Developer analysis contract must preserve read-only action=analyze.');
  assert(
    !(developerAnalyzeExecution.json?.load_paths ?? []).some((item) => item.startsWith('roles/module-analyst/') || item.includes('module-context')),
    'Developer read-only analysis must not load Module Analyst report rules.'
  );

  const compatibilityRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-agent-runtime-config-'));
  try {
    const baseProjectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
    const legacyProjectConfig = clone(baseProjectConfig);
    legacyProjectConfig.context_policy.high_risk_conditions = ['architecture'];
    fs.writeFileSync(path.join(compatibilityRoot, 'project.config.json'), JSON.stringify(legacyProjectConfig), 'utf8');
    const legacyResult = runCli(entry, compatibilityRoot, routingRequest);
    assert(legacyResult.exitCode === 0 && legacyResult.json?.status === 'resolved', 'Deprecated high_risk_conditions must remain compatible during 2.x.');
    assert(
      (legacyResult.json?.diagnostics ?? []).some((item) =>
        item.code === 'DEPRECATED_PROJECT_CONFIG_FIELD'
          && item.path === '/project_config/context_policy/high_risk_conditions'),
      'Deprecated high_risk_conditions must emit a stable warning diagnostic.'
    );

    const typoProjectConfig = clone(baseProjectConfig);
    typoProjectConfig.context_policy.require_module_context_fro = ['develop'];
    fs.writeFileSync(path.join(compatibilityRoot, 'project.config.json'), JSON.stringify(typoProjectConfig), 'utf8');
    const typoResult = runCli(entry, compatibilityRoot, routingRequest);
    assert(typoResult.exitCode === 2 && typoResult.json?.status === 'blocked', 'Unknown context_policy fields must fail closed.');
    assert(typoResult.json?.error_code === 'PROJECT_CONFIG_INVALID', 'Unknown context_policy fields must return PROJECT_CONFIG_INVALID.');
    assert(
      (typoResult.json?.diagnostics ?? []).some((item) =>
        item.code === 'PROJECT_CONFIG_INVALID'
          && item.path === '/project_config/context_policy/require_module_context_fro'),
      'Unknown context_policy fields must identify the exact invalid path.'
    );
  } finally {
    const canonicalTemp = fs.realpathSync.native(os.tmpdir());
    const canonicalCompatibilityRoot = fs.realpathSync.native(compatibilityRoot);
    const relation = path.relative(canonicalTemp, canonicalCompatibilityRoot);
    if (relation && relation !== '..' && !relation.startsWith(`..${path.sep}`) && !path.isAbsolute(relation)) {
      fs.rmSync(canonicalCompatibilityRoot, { recursive: true, force: true });
    }
  }

  const invalidJson = runCli(entry, projectRoot, '{not-json');
  assert(invalidJson.exitCode === 64, `Invalid JSON must exit 64, received ${invalidJson.exitCode}.`);
  assert(invalidJson.parseError === null && invalidJson.json?.status === 'invalid', 'Invalid JSON must return one legal status=invalid JSON result.');
  assert(invalidJson.json?.error_code === 'INVALID_JSON', 'Invalid JSON must return error_code=INVALID_JSON.');

  const invalidRequest = runCli(entry, projectRoot, {
    protocol_version: '999.0',
    operation: 'resolve-routing',
    task_manifest: manifest,
    unexpected: true
  });
  assert(invalidRequest.exitCode === 64, `Invalid Runtime request must exit 64, received ${invalidRequest.exitCode}.`);
  assert(invalidRequest.parseError === null && invalidRequest.json?.status === 'invalid', 'Invalid Runtime request must return one legal status=invalid JSON result.');
  assert(
    (invalidRequest.json?.diagnostics ?? []).some((item) => item.code === 'UNSUPPORTED_PROTOCOL_VERSION'),
    'Invalid Runtime request must report the unsupported protocol version.'
  );

  const absoluteRootManifest = clone(manifest);
  absoluteRootManifest.task_id = 'runtime-absolute-manifest-root';
  absoluteRootManifest.project.project_root = projectRoot;
  const invalidManifestRoot = runCli(entry, projectRoot, { ...routingRequest, task_manifest: absoluteRootManifest });
  assert(invalidManifestRoot.exitCode === 64, `Absolute Task Manifest project root must exit 64, received ${invalidManifestRoot.exitCode}.`);
  assert(
    (invalidManifestRoot.json?.diagnostics ?? []).some((item) => item.path === '/task_manifest/project/project_root'),
    'Absolute Task Manifest project root must be rejected at the Runtime boundary.'
  );

  const incompleteRolePlan = clone(rolePlan);
  delete incompleteRolePlan.result_reporting;
  const invalidRolePlan = runCli(entry, projectRoot, { ...executionRequest, role_plan: incompleteRolePlan });
  assert(invalidRolePlan.exitCode === 64, `Incomplete Role Plan must exit 64, received ${invalidRolePlan.exitCode}.`);
  assert(invalidRolePlan.json?.operation === 'resolve-execution' && invalidRolePlan.json?.task_id === manifest.task_id, 'Invalid Role Plan response must preserve operation and task_id context.');
  assert(invalidRolePlan.json?.error_code === 'REQUIRED_FIELD_MISSING', 'Incomplete Role Plan must retain the first diagnostic error code.');
  assert(
    (invalidRolePlan.json?.diagnostics ?? []).some((item) => item.code === 'REQUIRED_FIELD_MISSING'
      && item.path === '/role_plan/result_reporting'
      && typeof item.reason === 'string'),
    'Incomplete Role Plan must expose code, path, and reason diagnostics.'
  );

  const stringFactsRolePlan = clone(rolePlan);
  stringFactsRolePlan.facts = ['task-type=change', 'target=docs'];
  const invalidStringFacts = runCli(entry, projectRoot, { ...executionRequest, role_plan: stringFactsRolePlan });
  assert(invalidStringFacts.exitCode === 64, `String Role Plan facts must exit 64, received ${invalidStringFacts.exitCode}.`);
  assert(
    invalidStringFacts.json?.operation === 'resolve-execution'
      && invalidStringFacts.json?.task_id === manifest.task_id
      && (invalidStringFacts.json?.diagnostics ?? []).length === 2
      && invalidStringFacts.json.diagnostics.every((item) => item.code === 'INVALID_ROLE_PLAN' && /\/role_plan\/facts\/\d+/.test(item.path)),
    'String Role Plan facts must be rejected with preserved execution context and item paths.'
  );
  assert(
    invalidStringFacts.json?.error_context?.stage === 'role-plan-validation'
      && invalidStringFacts.json?.error_context?.role_id === 'developer',
    'Invalid Role Plan must provide a compact error context for LLM interpretation.'
  );

  const lowConfidenceManifest = clone(manifest);
  lowConfidenceManifest.task_id = 'runtime-low-confidence-scope';
  lowConfidenceManifest.provenance.scope.confidence = 0.5;
  const lowConfidenceRisk = assessTaskRisk(lowConfidenceManifest, policy);
  assert(lowConfidenceRisk.status === 'needs-resolution', 'Low-confidence scope must fail closed during Risk assessment.');
  assert(
    lowConfidenceRisk.unresolved.includes('risk-provenance-low-confidence:scope'),
    'Low-confidence scope must return a stable unresolved diagnostic.'
  );
  const blocked = runCli(entry, projectRoot, { ...routingRequest, task_manifest: lowConfidenceManifest });
  assert(blocked.exitCode === 2, `Workflow Risk blocker must exit 2, received ${blocked.exitCode}.`);
  assert(blocked.parseError === null && blocked.json?.status === 'blocked', 'Workflow blocker must return one legal status=blocked JSON result.');
  assert(
    (blocked.json?.diagnostics ?? []).some((item) => item.code === 'RISK_BLOCKED'),
    'Low-confidence Risk blocker must expose RISK_BLOCKED diagnostics.'
  );

  const unresolvedModuleManifest = clone(manifest);
  unresolvedModuleManifest.task_id = 'runtime-module-identity-unresolved';
  unresolvedModuleManifest.action = 'analyze';
  unresolvedModuleManifest.task_type = 'analysis';
  unresolvedModuleManifest.role_id = 'module-analyst';
  unresolvedModuleManifest.raw_request = '角色：module-analyst\n分析尚未指定名稱的模組。';
  unresolvedModuleManifest.analysis_mode = 'module';
  unresolvedModuleManifest.modules = [];
  unresolvedModuleManifest.unresolved = ['module-identity-unresolved'];
  unresolvedModuleManifest.status = 'needs-resolution';
  unresolvedModuleManifest.provenance.action = { source: 'explicit', confidence: 1, evidence: ['module analysis'], candidates: ['analyze'] };
  unresolvedModuleManifest.provenance.task_type = { source: 'inference', confidence: 1, evidence: ['analysis request'], candidates: ['analysis'] };
  unresolvedModuleManifest.provenance.role_id = { source: 'explicit', confidence: 1, evidence: ['module-analyst'], candidates: ['module-analyst'] };
  unresolvedModuleManifest.provenance.modules = { source: 'inference', confidence: 0, evidence: ['No unique module'], candidates: [] };
  unresolvedModuleManifest.provenance.analysis_mode = { source: 'explicit', confidence: 1, evidence: ['module scope'], candidates: ['module'] };
  const moduleBlocked = runCli(entry, projectRoot, { ...routingRequest, task_manifest: unresolvedModuleManifest });
  assert(moduleBlocked.exitCode === 2 && moduleBlocked.json?.status === 'blocked', 'Unresolved Module Analyst request must be blocked.');
  assert(
    moduleBlocked.json?.error_context?.stage === 'risk-and-profile'
      && moduleBlocked.json?.error_context?.role_id === 'module-analyst'
      && moduleBlocked.json?.error_context?.manifest_unresolved?.includes('module-identity-unresolved')
      && moduleBlocked.json?.error_context?.module_count === 0
      && moduleBlocked.json?.error_context?.project_config?.module_registry_configured === false,
    'Module Analyst blocker must expose enough compact context to identify a missing module search seed without treating project configuration as the remedy.'
  );

  const discoveryManifest = clone(manifest);
  discoveryManifest.task_id = 'runtime-module-repository-discovery';
  discoveryManifest.raw_request = '角色：module-analyst\n分析 inventory-v2 模組並自行尋找相關檔案';
  discoveryManifest.action = 'analyze';
  discoveryManifest.task_type = 'analysis';
  discoveryManifest.role_id = 'module-analyst';
  discoveryManifest.targets = [];
  discoveryManifest.target_mode = 'unknown';
  discoveryManifest.modules = [{ module_id: 'inventory-v2', name: 'inventory-v2', aliases: [], candidate_paths: [] }];
  discoveryManifest.scope = { summary: 'Discover inventory-v2 inside Project Root.', include_paths: [], exclude_paths: [], change_source: 'request' };
  discoveryManifest.review_mode = null;
  discoveryManifest.analysis_mode = 'module';
  discoveryManifest.routing_triggers = [];
  discoveryManifest.unresolved = [];
  discoveryManifest.status = 'analyzed';
  discoveryManifest.provenance = {
    action: { source: 'explicit', confidence: 1, evidence: ['module analysis'], candidates: ['analyze'] },
    task_type: { source: 'inference', confidence: 1, evidence: ['analysis request'], candidates: ['analysis'] },
    role_id: { source: 'explicit', confidence: 1, evidence: ['module-analyst'], candidates: ['module-analyst'] },
    skill_ids: { source: 'inference', confidence: 1, evidence: ['No explicit skill'], candidates: [] },
    targets: { source: 'inference', confidence: 1, evidence: ['Target-neutral repository discovery'], candidates: [] },
    modules: { source: 'explicit', confidence: 1, evidence: ['inventory-v2 is explicitly named'], candidates: ['inventory-v2'] },
    scope: { source: 'explicit', confidence: 1, evidence: ['Project Root discovery'], candidates: ['module'] },
    routing_triggers: { source: 'inference', confidence: 1, evidence: ['No risk trigger stated'], candidates: [] },
    review_mode: { source: 'inference', confidence: 1, evidence: ['Not a review'], candidates: [] },
    analysis_mode: { source: 'explicit', confidence: 1, evidence: ['Named module scope'], candidates: ['module'] }
  };
  const implicitModuleAnalystManifest = clone(discoveryManifest);
  implicitModuleAnalystManifest.task_id = 'runtime-module-analysis-without-explicit-role';
  implicitModuleAnalystManifest.raw_request = '分析 inventory-v2 模組並自行尋找相關檔案';
  implicitModuleAnalystManifest.provenance.role_id = {
    source: 'inference',
    confidence: 1,
    evidence: ['Module scope alone must not activate Module Analyst'],
    candidates: ['module-analyst']
  };
  const implicitModuleAnalyst = runCli(entry, projectRoot, { ...routingRequest, task_manifest: implicitModuleAnalystManifest });
  assert(implicitModuleAnalyst.exitCode === 2 && implicitModuleAnalyst.json?.status === 'blocked', 'Module Analyst without the exact standalone Role directive must be blocked.');
  assert(implicitModuleAnalyst.json?.error_code === 'ROLE_EXPLICIT_ACTIVATION_REQUIRED', 'Implicit Module Analyst routing must return ROLE_EXPLICIT_ACTIVATION_REQUIRED.');
  assert(
    (implicitModuleAnalyst.json?.diagnostics ?? []).some((item) => item.path === '/task_manifest/role_id'),
    'Implicit Module Analyst blocker must identify role_id.'
  );
  const discoveryRole = (roles.roles ?? []).find((item) => item.role_id === 'module-analyst');
  const discoveryRisk = assessTaskRisk(discoveryManifest, policy);
  const discoveryRolePlan = buildReferenceRolePlan(discoveryManifest, discoveryRole, discoveryRisk);
  const discoveryExecution = runCli(entry, projectRoot, {
    ...routingRequest,
    operation: 'resolve-execution',
    task_manifest: discoveryManifest,
    role_plan: discoveryRolePlan
  });
  assert(discoveryExecution.exitCode === 0 && discoveryExecution.json?.status === 'ready', 'Named Module Analysis must execute without Module Registry or candidate paths.');
  assert(discoveryExecution.json?.preflight?.status === 'PASS', 'Named Module Analysis must pass without Module Context warnings.');
  assert(!(discoveryExecution.json?.resolved_rule_set?.contexts ?? []).some((item) => item.type === 'module'), 'Runtime must not return a Module Context path for Module Analyst execution.');
  assert(!(discoveryExecution.json?.role_plan?.context_requirements ?? []).includes('module'), 'Runtime Role Plan must not require Module Context for Module Analyst.');

  for (const trigger of policy.hard_triggers ?? []) {
    const triggerManifest = clone(manifest);
    triggerManifest.task_id = `runtime-hard-trigger-${trigger}`;
    triggerManifest.routing_triggers = [trigger];
    triggerManifest.provenance.routing_triggers = {
      source: 'explicit',
      confidence: 1,
      evidence: [`canonical hard trigger: ${trigger}`],
      candidates: [trigger]
    };
    const taskRisk = assessTaskRisk(triggerManifest, policy);
    assert(taskRisk.level === 3, `Canonical hard trigger must produce Level 3: ${trigger}`);
    assert(taskRisk.status === 'assessed', `Canonical hard trigger must remain fully assessed: ${trigger}`);
    assert(taskRisk.hard_triggers.includes(trigger), `Canonical hard trigger must be preserved in Risk output: ${trigger}`);
  }
  assert((policy.hard_triggers ?? []).length === 34, 'Runtime integration suite expects exactly 34 canonical hard triggers.');

  const lightweightRisk = assessTaskRisk(manifest, policy);
  const lightweightProfile = resolveExecutionProfile(manifest, lightweightRisk, role, skills.skills ?? []);
  assert(lightweightRisk.level === 1 && lightweightRisk.status === 'assessed', 'Routine single-file fixture must resolve to assessed Level 1.');
  assert(lightweightProfile.profile_id === 'lightweight' && lightweightProfile.status === 'selected', 'Level 1 must select the lightweight profile.');
  assert(lightweightProfile.required_stages.includes('context-resolution'), 'Lightweight profile must include context-resolution.');
  assert(JSON.stringify(lightweightProfile.skipped_stages) === '[]', 'Selected lightweight profile must not skip any stage.');

  const loadPaths = execution.json?.load_paths ?? [];
  const expectedLoadPaths = [];
  for (const ruleRecord of [...(execution.json?.resolved_rule_set?.rules ?? [])].sort((left, right) => left.load_order - right.load_order)) {
    if (typeof ruleRecord.path === 'string') expectedLoadPaths.push(ruleRecord.path);
  }
  for (const contextRecord of [...(execution.json?.resolved_rule_set?.contexts ?? [])].sort((left, right) => left.context_id.localeCompare(right.context_id))) {
    if (typeof contextRecord.path === 'string') expectedLoadPaths.push(contextRecord.path);
  }
  if (typeof execution.json?.resolved_rule_set?.executor_entry === 'string') {
    expectedLoadPaths.push(execution.json.resolved_rule_set.executor_entry);
  }
  const uniqueExpectedLoadPaths = [...new Set(expectedLoadPaths.map((item) => item.replaceAll('\\', '/')))];
  assert(
    JSON.stringify(loadPaths) === JSON.stringify(uniqueExpectedLoadPaths),
    `Runtime load_paths must preserve executor/rule/context load order: actual=${JSON.stringify(loadPaths)} expected=${JSON.stringify(uniqueExpectedLoadPaths)}`
  );
  for (const loadPath of [...(routing.json?.next?.load_paths ?? []), ...loadPaths]) {
    assert(isSafeRelativePath(loadPath), `Runtime returned an unsafe load path: ${loadPath}`);
  }

  const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-agent-runtime-readonly-'));
  try {
    fs.copyFileSync(path.join(projectRoot, 'project.config.json'), path.join(isolatedRoot, 'project.config.json'));
    const before = snapshotDirectory(isolatedRoot);
    const isolatedRouting = runCli(entry, isolatedRoot, routingRequest);
    const isolatedExecution = runCli(entry, isolatedRoot, executionRequest);
    const after = snapshotDirectory(isolatedRoot);
    assert(isolatedRouting.exitCode === 0 && isolatedExecution.exitCode === 0, 'Runtime read-only verification requests must succeed in an isolated Project Root.');
    assert(JSON.stringify(after) === JSON.stringify(before), 'Runtime CLI must not create or modify files in the Project Root.');
  } finally {
    const canonicalTemp = fs.realpathSync.native(os.tmpdir());
    const canonicalIsolated = fs.realpathSync.native(isolatedRoot);
    const relation = path.relative(canonicalTemp, canonicalIsolated);
    if (relation && relation !== '..' && !relation.startsWith(`..${path.sep}`) && !path.isAbsolute(relation)) {
      fs.rmSync(canonicalIsolated, { recursive: true, force: true });
    }
  }

  notes.push(`Runtime CLI checked: 5 success paths, 7 invalid/blocking inputs, ${policy.hard_triggers.length} hard triggers, explicit Role activation, config compatibility, fail-closed and read-only behavior`);
}
