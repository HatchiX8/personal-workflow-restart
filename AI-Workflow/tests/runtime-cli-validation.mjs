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
  const result = spawnSync(process.execPath, [entry, '--stdin'], {
    cwd,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: 15_000
  });
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
  const rolePlan = buildReferenceRolePlan(manifest, role);
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
    JSON.stringify(routing.json?.next?.load_paths) === JSON.stringify([role.planner]),
    'Runtime routing must return only the selected canonical Role Planner path.'
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

  notes.push(`Runtime CLI checked: 2 success paths, 2 invalid inputs, ${policy.hard_triggers.length} hard triggers, fail-closed and read-only behavior`);
}
