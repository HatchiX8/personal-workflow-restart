import fs from 'node:fs';
import path from 'node:path';

import { diagnostic, RuntimeInputError, RuntimeWorkflowError } from './diagnostics.mjs';

export const PROTOCOL_VERSION = '1.0';
export const OPERATIONS = Object.freeze(['resolve-routing', 'resolve-execution']);

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');

function requireKeys(value, keys, basePath, diagnostics) {
  for (const key of keys) {
    if (!own(value, key)) {
      diagnostics.push(diagnostic('REQUIRED_FIELD_MISSING', `${basePath}/${key}`, 'Required field is missing.'));
    }
  }
}

function validateTaskManifest(manifest) {
  const diagnostics = [];
  if (!isObject(manifest)) {
    return [diagnostic('INVALID_TASK_MANIFEST', '/task_manifest', 'Task Manifest must be an object.')];
  }

  requireKeys(manifest, [
    'schema_version', 'task_id', 'created_at', 'raw_request', 'action', 'task_type', 'role_id',
    'skill_ids', 'targets', 'target_mode', 'project', 'modules', 'scope', 'routing_triggers',
    'review_mode', 'analysis_mode', 'provenance', 'unresolved', 'status'
  ], '/task_manifest', diagnostics);

  if (manifest.schema_version !== '1.0') diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/schema_version', 'Expected schema_version 1.0.'));
  if (!isNonEmptyString(manifest.task_id)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/task_id', 'task_id must be a non-empty string.'));
  if (!isNonEmptyString(manifest.created_at) || Number.isNaN(Date.parse(manifest.created_at))) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/created_at', 'created_at must be a date-time string.'));
  if (!isNonEmptyString(manifest.raw_request)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/raw_request', 'raw_request must be a non-empty string.'));
  if (!['develop', 'review', 'analyze', 'unknown'].includes(manifest.action)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/action', 'action is not canonical.'));
  if (!['feature', 'change', 'bugfix', 'refactor', 'migration', 'maintenance', 'analysis', 'unknown'].includes(manifest.task_type)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/task_type', 'task_type is not canonical.'));
  if (!(manifest.role_id === null || isNonEmptyString(manifest.role_id))) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/role_id', 'role_id must be a non-empty string or null.'));
  if (!isStringArray(manifest.skill_ids)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/skill_ids', 'skill_ids must be an array of strings.'));
  if (!Array.isArray(manifest.targets) || !manifest.targets.every((item) => ['frontend', 'backend', 'database', 'tooling', 'docs'].includes(item))) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/targets', 'targets must contain only canonical target IDs.'));
  if (!['single', 'fullstack', 'mixed', 'unknown'].includes(manifest.target_mode)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/target_mode', 'target_mode is not canonical.'));
  if (!isObject(manifest.project)) {
    diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/project', 'project must be an object.'));
  } else {
    requireKeys(manifest.project, ['project_id', 'project_root', 'config_path'], '/task_manifest/project', diagnostics);
    for (const key of ['project_id', 'config_path']) {
      if (!(manifest.project[key] === null || typeof manifest.project[key] === 'string')) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `/task_manifest/project/${key}`, `${key} must be a string or null.`));
    }
    if (manifest.project.project_root !== '.') diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/project/project_root', 'project_root must be the Project Root-relative value ".".'));
  }
  if (!Array.isArray(manifest.modules)) {
    diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/modules', 'modules must be an array.'));
  } else {
    for (let index = 0; index < manifest.modules.length; index += 1) {
      const module = manifest.modules[index];
      const modulePath = `/task_manifest/modules/${index}`;
      if (!isObject(module)) {
        diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', modulePath, 'Module must be an object.'));
        continue;
      }
      requireKeys(module, ['module_id', 'name', 'aliases', 'candidate_paths'], modulePath, diagnostics);
      if (!isNonEmptyString(module.module_id)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${modulePath}/module_id`, 'module_id must be a non-empty string.'));
      if (typeof module.name !== 'string') diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${modulePath}/name`, 'name must be a string.'));
      if (!isStringArray(module.aliases)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${modulePath}/aliases`, 'aliases must be an array of strings.'));
      if (!isStringArray(module.candidate_paths)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${modulePath}/candidate_paths`, 'candidate_paths must be an array of strings.'));
    }
  }
  if (!isObject(manifest.scope)) {
    diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/scope', 'scope must be an object.'));
  } else {
    requireKeys(manifest.scope, ['summary', 'include_paths', 'exclude_paths', 'change_source'], '/task_manifest/scope', diagnostics);
    if (typeof manifest.scope.summary !== 'string') diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/scope/summary', 'summary must be a string.'));
    if (!isStringArray(manifest.scope.include_paths)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/scope/include_paths', 'include_paths must be an array of strings.'));
    if (!isStringArray(manifest.scope.exclude_paths)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/scope/exclude_paths', 'exclude_paths must be an array of strings.'));
    if (!['request', 'staged', 'worktree', 'full-project'].includes(manifest.scope.change_source)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/scope/change_source', 'change_source is not canonical.'));
  }
  if (!isStringArray(manifest.routing_triggers)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/routing_triggers', 'routing_triggers must be an array of strings.'));
  if (!isObject(manifest.provenance)) {
    diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/provenance', 'provenance must be an object.'));
  } else {
    for (const [key, provenance] of Object.entries(manifest.provenance)) {
      const provenancePath = `/task_manifest/provenance/${key}`;
      if (!isObject(provenance)) {
        diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', provenancePath, 'Provenance record must be an object.'));
        continue;
      }
      requireKeys(provenance, ['source', 'confidence', 'evidence', 'candidates'], provenancePath, diagnostics);
      if (!['explicit', 'config', 'registry', 'repository-evidence', 'inference'].includes(provenance.source)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${provenancePath}/source`, 'Provenance source is not canonical.'));
      if (typeof provenance.confidence !== 'number' || provenance.confidence < 0 || provenance.confidence > 1) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${provenancePath}/confidence`, 'Provenance confidence must be between 0 and 1.'));
      if (!isStringArray(provenance.evidence)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${provenancePath}/evidence`, 'Provenance evidence must be an array of strings.'));
      if (!isStringArray(provenance.candidates)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', `${provenancePath}/candidates`, 'Provenance candidates must be an array of strings.'));
    }
  }
  if (!isStringArray(manifest.unresolved)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/unresolved', 'unresolved must be an array of strings.'));
  if (!['analyzed', 'needs-resolution'].includes(manifest.status)) diagnostics.push(diagnostic('INVALID_TASK_MANIFEST', '/task_manifest/status', 'status must be analyzed or needs-resolution.'));

  return diagnostics;
}

function validateRolePlan(rolePlan) {
  const diagnostics = [];
  if (!isObject(rolePlan)) {
    return [diagnostic('INVALID_ROLE_PLAN', '/role_plan', 'Role Plan must be an object.')];
  }

  requireKeys(rolePlan, [
    'schema_version', 'task_id', 'role_id', 'action', 'planner_entry', 'facts', 'skill_selectors',
    'result_reporting', 'validation_profiles', 'context_requirements', 'unresolved', 'status'
  ], '/role_plan', diagnostics);

  if (rolePlan.schema_version !== '1.0') diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/schema_version', 'Expected schema_version 1.0.'));
  if (!isNonEmptyString(rolePlan.task_id)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/task_id', 'task_id must be a non-empty string.'));
  if (!isNonEmptyString(rolePlan.role_id)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/role_id', 'role_id must be a non-empty string.'));
  if (!['develop', 'review', 'analyze'].includes(rolePlan.action)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/action', 'action is not canonical.'));
  if (!isNonEmptyString(rolePlan.planner_entry) || path.isAbsolute(rolePlan.planner_entry) || rolePlan.planner_entry.split(/[\\/]/u).includes('..')) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/planner_entry', 'planner_entry must be a safe Workflow-relative path.'));
  for (const key of ['facts', 'skill_selectors', 'validation_profiles', 'context_requirements', 'unresolved']) {
    if (!Array.isArray(rolePlan[key])) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `/role_plan/${key}`, `${key} must be an array.`));
  }
  if (Array.isArray(rolePlan.facts)) {
    for (let index = 0; index < rolePlan.facts.length; index += 1) {
      const fact = rolePlan.facts[index];
      const factPath = `/role_plan/facts/${index}`;
      if (!isObject(fact)) {
        diagnostics.push(diagnostic('INVALID_ROLE_PLAN', factPath, 'Fact must be an object.'));
        continue;
      }
      requireKeys(fact, ['fact_id', 'values', 'source', 'confidence', 'evidence'], factPath, diagnostics);
      if (!isNonEmptyString(fact.fact_id)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `${factPath}/fact_id`, 'fact_id must be a non-empty string.'));
      if (!isStringArray(fact.values) || fact.values.length === 0) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `${factPath}/values`, 'values must be a non-empty array of strings.'));
      if (!['manifest', 'config', 'registry', 'repository-evidence', 'inference'].includes(fact.source)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `${factPath}/source`, 'Fact source is not canonical.'));
      if (typeof fact.confidence !== 'number' || fact.confidence < 0 || fact.confidence > 1) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `${factPath}/confidence`, 'Fact confidence must be between 0 and 1.'));
      if (!isStringArray(fact.evidence)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `${factPath}/evidence`, 'Fact evidence must be an array of strings.'));
    }
  }
  for (const key of ['skill_selectors', 'validation_profiles', 'unresolved']) {
    if (Array.isArray(rolePlan[key]) && !isStringArray(rolePlan[key])) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', `/role_plan/${key}`, `${key} must contain only strings.`));
  }
  if (Array.isArray(rolePlan.context_requirements) && !rolePlan.context_requirements.every((item) => ['project', 'module'].includes(item))) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/context_requirements', 'context_requirements contains an unsupported value.'));
  if (!isObject(rolePlan.result_reporting)) {
    diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/result_reporting', 'result_reporting must be an object.'));
  } else {
    requireKeys(rolePlan.result_reporting, ['minimum_level', 'reasons', 'upward_escalation'], '/role_plan/result_reporting', diagnostics);
    if (![1, 2, 3].includes(rolePlan.result_reporting.minimum_level)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/result_reporting/minimum_level', 'minimum_level must be 1, 2, or 3.'));
    if (!isStringArray(rolePlan.result_reporting.reasons) || rolePlan.result_reporting.reasons.length === 0) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/result_reporting/reasons', 'reasons must be a non-empty array of strings.'));
    if (rolePlan.result_reporting.upward_escalation !== true) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/result_reporting/upward_escalation', 'upward_escalation must be true.'));
  }
  if (!['planned', 'needs-resolution'].includes(rolePlan.status)) diagnostics.push(diagnostic('INVALID_ROLE_PLAN', '/role_plan/status', 'status must be planned or needs-resolution.'));

  return diagnostics;
}

export function parseRuntimeRequest(rawInput) {
  if (typeof rawInput !== 'string' || rawInput.trim() === '') {
    throw new RuntimeInputError('EMPTY_REQUEST', 'Request file must contain one JSON request.', '/');
  }

  let request;
  try {
    request = JSON.parse(rawInput);
  } catch {
    throw new RuntimeInputError('INVALID_JSON', 'Request file is not valid JSON.', '/');
  }

  const diagnostics = [];
  if (!isObject(request)) {
    throw new RuntimeInputError('INVALID_REQUEST', 'Runtime request must be an object.', '/');
  }

  const allowedKeys = new Set(['protocol_version', 'operation', 'project_root', 'task_manifest', 'role_plan']);
  for (const key of Object.keys(request)) {
    if (!allowedKeys.has(key)) diagnostics.push(diagnostic('UNKNOWN_REQUEST_FIELD', `/${key}`, 'Field is not part of the runtime request protocol.'));
  }
  requireKeys(request, ['protocol_version', 'operation', 'task_manifest'], '', diagnostics);
  if (own(request, 'protocol_version') && request.protocol_version !== PROTOCOL_VERSION) diagnostics.push(diagnostic('UNSUPPORTED_PROTOCOL_VERSION', '/protocol_version', `Expected protocol_version ${PROTOCOL_VERSION}.`));
  if (own(request, 'operation') && !OPERATIONS.includes(request.operation)) diagnostics.push(diagnostic('UNSUPPORTED_OPERATION', '/operation', 'operation must be resolve-routing or resolve-execution.'));
  if (own(request, 'project_root') && !isNonEmptyString(request.project_root)) diagnostics.push(diagnostic('INVALID_PROJECT_ROOT', '/project_root', 'project_root must be a non-empty string when provided.'));
  if (own(request, 'task_manifest')) diagnostics.push(...validateTaskManifest(request.task_manifest));
  if (request.operation === 'resolve-execution') {
    if (!own(request, 'role_plan')) diagnostics.push(diagnostic('REQUIRED_FIELD_MISSING', '/role_plan', 'resolve-execution requires role_plan.'));
    else diagnostics.push(...validateRolePlan(request.role_plan));
  }

  if (diagnostics.length > 0) {
    throw new RuntimeInputError('INVALID_RUNTIME_REQUEST', 'Runtime request failed boundary validation.', '/', diagnostics);
  }
  return request;
}

function canonicalDirectory(candidate, errorType, fieldPath) {
  try {
    const canonical = fs.realpathSync.native(candidate);
    if (!fs.statSync(canonical).isDirectory()) throw new Error('not-directory');
    return canonical;
  } catch {
    throw new errorType(
      fieldPath === '/project_root' ? 'PROJECT_ROOT_UNAVAILABLE' : 'WORKFLOW_ROOT_UNAVAILABLE',
      `${fieldPath.slice(1)} does not resolve to a readable directory.`,
      fieldPath
    );
  }
}

export function resolveRuntimeRoots(request, workflowRoot, cwd = process.cwd()) {
  const canonicalWorkflowRoot = canonicalDirectory(workflowRoot, RuntimeWorkflowError, '/workflow_root');
  const canonicalCwd = canonicalDirectory(path.resolve(cwd), RuntimeInputError, '/project_root');
  const projectCandidate = own(request, 'project_root')
    ? path.resolve(cwd, request.project_root)
    : path.resolve(cwd);
  const canonicalProjectRoot = canonicalDirectory(projectCandidate, RuntimeInputError, '/project_root');
  if (path.relative(canonicalCwd, canonicalProjectRoot) !== '') {
    throw new RuntimeInputError(
      'INVALID_PROJECT_ROOT',
      'project_root must resolve to the Runtime launch directory.',
      '/project_root'
    );
  }

  for (const [root, requiredFile, fieldPath, errorCode] of [
    [canonicalWorkflowRoot, 'workflow.config.json', '/workflow_root', 'WORKFLOW_CONFIG_UNAVAILABLE'],
    [canonicalProjectRoot, 'project.config.json', '/project_root', 'PROJECT_CONFIG_UNAVAILABLE']
  ]) {
    try {
      const candidate = path.join(root, requiredFile);
      if (!fs.statSync(candidate).isFile()) throw new Error('not-file');
      fs.accessSync(candidate, fs.constants.R_OK);
    } catch {
      throw new RuntimeWorkflowError(errorCode, `${requiredFile} is unavailable.`, fieldPath);
    }
  }

  return { workflowRoot: canonicalWorkflowRoot, projectRoot: canonicalProjectRoot };
}
