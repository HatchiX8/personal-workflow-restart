#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  assessTaskRisk,
  preflightReferencePipeline,
  roleActivationSatisfied,
  resolveExecutionProfile,
  runReferencePipeline,
  verifyExecutor
} from './core/pipeline.mjs';
import {
  diagnostic,
  EXIT_CODES,
  isRuntimeFailure,
  RuntimeInputError,
  RuntimeWorkflowError
} from './protocol/diagnostics.mjs';
import { parseRuntimeRequest, resolveRuntimeRoots } from './protocol/request.mjs';
import {
  blockedResult,
  executionResult,
  internalErrorResult,
  invalidResult,
  routingResult
} from './protocol/response.mjs';

const RUNTIME_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DERIVED_WORKFLOW_ROOT = path.resolve(RUNTIME_DIRECTORY, '..');

const MAX_REQUEST_BYTES = 1024 * 1024;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function inspectProjectConfig(projectRoot) {
  let projectConfig;
  try {
    projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
  } catch {
    throw new RuntimeWorkflowError('PROJECT_CONFIG_INVALID', 'project.config.json is not valid JSON.', '/project_config');
  }

  const policy = projectConfig.context_policy;
  if (!isObject(policy)) {
    throw new RuntimeWorkflowError('PROJECT_CONFIG_INVALID', 'context_policy must be an object.', '/project_config/context_policy');
  }

  const allowedFields = new Set([
    'require_project_context_for',
    'require_module_context_for',
    'allow_project_analysis_without_context',
    'status_policy',
    'high_risk_conditions'
  ]);
  for (const key of Object.keys(policy)) {
    if (!allowedFields.has(key)) {
      throw new RuntimeWorkflowError(
        'PROJECT_CONFIG_INVALID',
        'Unknown context_policy field.',
        `/project_config/context_policy/${key}`
      );
    }
  }

  const actions = new Set(['develop', 'review', 'analyze']);
  for (const key of ['require_project_context_for', 'require_module_context_for']) {
    if (!Object.hasOwn(policy, key)) continue;
    const values = policy[key];
    if (!Array.isArray(values) || !values.every((value) => actions.has(value)) || new Set(values).size !== values.length) {
      throw new RuntimeWorkflowError(
        'PROJECT_CONFIG_INVALID',
        `${key} must contain unique canonical actions.`,
        `/project_config/context_policy/${key}`
      );
    }
  }

  if (
    Object.hasOwn(policy, 'allow_project_analysis_without_context')
    && typeof policy.allow_project_analysis_without_context !== 'boolean'
  ) {
    throw new RuntimeWorkflowError(
      'PROJECT_CONFIG_INVALID',
      'allow_project_analysis_without_context must be a boolean.',
      '/project_config/context_policy/allow_project_analysis_without_context'
    );
  }

  if (Object.hasOwn(policy, 'status_policy')) {
    const statusPolicy = policy.status_policy;
    if (!isObject(statusPolicy)) {
      throw new RuntimeWorkflowError('PROJECT_CONFIG_INVALID', 'status_policy must be an object.', '/project_config/context_policy/status_policy');
    }
    const allowedStatusFields = new Set(['current', 'stale', 'partial', 'unknown', 'required_context_failure']);
    const allowedStatusValues = {
      current: new Set(['pass']),
      stale: new Set(['warning', 'blocked']),
      partial: new Set(['warning', 'blocked']),
      unknown: new Set(['warning', 'blocked']),
      required_context_failure: new Set(['blocked'])
    };
    for (const [key, value] of Object.entries(statusPolicy)) {
      if (!allowedStatusFields.has(key) || !allowedStatusValues[key].has(value)) {
        throw new RuntimeWorkflowError(
          'PROJECT_CONFIG_INVALID',
          'Unknown status_policy field or unsupported value.',
          `/project_config/context_policy/status_policy/${key}`
        );
      }
    }
  }

  const diagnostics = [];
  if (Object.hasOwn(policy, 'high_risk_conditions')) {
    const values = policy.high_risk_conditions;
    if (!Array.isArray(values) || !values.every((value) => typeof value === 'string' && value.length > 0) || new Set(values).size !== values.length) {
      throw new RuntimeWorkflowError(
        'PROJECT_CONFIG_INVALID',
        'high_risk_conditions must contain unique non-empty strings.',
        '/project_config/context_policy/high_risk_conditions'
      );
    }
    diagnostics.push(diagnostic(
      'DEPRECATED_PROJECT_CONFIG_FIELD',
      '/project_config/context_policy/high_risk_conditions',
      'high_risk_conditions is deprecated and ignored; remove it from project.config.json.'
    ));
  }
  return diagnostics;
}

function readRequestFile(projectRoot, requestDirectory, requestPath) {
  if (typeof requestPath !== 'string' || requestPath.length === 0 || path.isAbsolute(requestPath)) {
    throw new RuntimeInputError('INVALID_REQUEST_PATH', 'Request file path must be project-relative.', '/arguments/1');
  }
  if (path.extname(requestPath).toLowerCase() !== '.json') {
    throw new RuntimeInputError('INVALID_REQUEST_PATH', 'Request file must use the .json extension.', '/arguments/1');
  }

  let canonicalProjectRoot;
  let canonicalRequestDirectory;
  let canonicalRequestFile;
  try {
    canonicalProjectRoot = fs.realpathSync.native(projectRoot);
    canonicalRequestDirectory = fs.realpathSync.native(path.resolve(canonicalProjectRoot, requestDirectory));
    canonicalRequestFile = fs.realpathSync.native(path.resolve(canonicalProjectRoot, requestPath));
    const requestStat = fs.lstatSync(path.resolve(canonicalProjectRoot, requestPath));
    if (requestStat.isSymbolicLink() || !fs.statSync(canonicalRequestFile).isFile()) throw new Error('invalid-file');
    fs.accessSync(canonicalRequestFile, fs.constants.R_OK);
  } catch {
    throw new RuntimeInputError('REQUEST_FILE_UNAVAILABLE', 'Request file is unavailable or is not a regular readable file.', '/arguments/1');
  }

  for (const [root, candidate] of [
    [canonicalProjectRoot, canonicalRequestDirectory],
    [canonicalRequestDirectory, canonicalRequestFile]
  ]) {
    const relation = path.relative(root, candidate);
    if (relation === '..' || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
      throw new RuntimeInputError('REQUEST_PATH_ESCAPE', 'Request file must remain inside the configured request directory.', '/arguments/1');
    }
  }

  const bytes = fs.statSync(canonicalRequestFile).size;
  if (bytes > MAX_REQUEST_BYTES) {
    throw new RuntimeInputError('REQUEST_FILE_TOO_LARGE', 'Request file exceeds the 1 MiB limit.', '/arguments/1');
  }
  return fs.readFileSync(canonicalRequestFile, 'utf8');
}

function resolveReadableFileWithin(root, relativePath, fieldPath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || path.isAbsolute(relativePath)) {
    throw new RuntimeWorkflowError('INVALID_WORKFLOW_PATH', 'Workflow path must be relative.', fieldPath);
  }

  let canonical;
  try {
    canonical = fs.realpathSync.native(path.resolve(root, relativePath));
    if (!fs.statSync(canonical).isFile()) throw new Error('not-file');
    fs.accessSync(canonical, fs.constants.R_OK);
  } catch {
    throw new RuntimeWorkflowError('WORKFLOW_RESOURCE_UNAVAILABLE', 'A required Workflow resource is unavailable.', fieldPath);
  }

  const relation = path.relative(root, canonical);
  if (relation === '..' || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
    throw new RuntimeWorkflowError('WORKFLOW_PATH_ESCAPE', 'Workflow path resolves outside Workflow Root.', fieldPath);
  }
  return canonical;
}

function readWorkflowJson(workflowRoot, relativePath, fieldPath) {
  const absolutePath = resolveReadableFileWithin(workflowRoot, relativePath, fieldPath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch {
    throw new RuntimeWorkflowError('INVALID_WORKFLOW_JSON', 'A required Workflow JSON file is invalid.', fieldPath);
  }
}

function loadRoutingMetadata(workflowRoot, manifest) {
  const workflowConfig = readWorkflowJson(workflowRoot, 'workflow.config.json', '/workflow_config');
  const roleRegistryPath = workflowConfig.registries?.roles;
  const skillRegistryPath = workflowConfig.registries?.skills;
  if (typeof roleRegistryPath !== 'string' || typeof skillRegistryPath !== 'string') {
    throw new RuntimeWorkflowError('REGISTRY_CONFIG_INVALID', 'Role or Skill Registry path is not configured.', '/workflow_config/registries');
  }

  const roleRegistry = readWorkflowJson(workflowRoot, roleRegistryPath, '/workflow_config/registries/roles');
  const skillRegistry = readWorkflowJson(workflowRoot, skillRegistryPath, '/workflow_config/registries/skills');
  const role = (roleRegistry.roles ?? []).find((item) => item.role_id === manifest.role_id && item.status === 'active') ?? null;
  const skills = Array.isArray(skillRegistry.skills) ? skillRegistry.skills : [];
  return { role, skills, workflowConfig };
}

function validateExecutionRegistries(workflowRoot) {
  const workflowConfig = readWorkflowJson(workflowRoot, 'workflow.config.json', '/workflow_config');
  for (const key of ['roles', 'skills', 'rule_bundles', 'modules']) {
    const registryPath = workflowConfig.registries?.[key];
    if (typeof registryPath !== 'string') {
      throw new RuntimeWorkflowError('REGISTRY_CONFIG_INVALID', `Registry path is not configured: ${key}.`, `/workflow_config/registries/${key}`);
    }
    readWorkflowJson(workflowRoot, registryPath, `/workflow_config/registries/${key}`);
  }
}

function validatePlannerPaths(workflowRoot, workflowConfig, role) {
  if (!role || typeof role.planner !== 'string') {
    throw new RuntimeWorkflowError('ROLE_PLANNER_UNRESOLVED', 'The active Role has no planner entry.', '/task_manifest/role_id');
  }
  const authoringPath = workflowConfig.orchestration?.role_plan_authoring;
  if (typeof authoringPath !== 'string') {
    throw new RuntimeWorkflowError('ROLE_PLAN_CONTRACT_UNRESOLVED', 'The Role Plan authoring contract is not configured.', '/workflow_config/orchestration/role_plan_authoring');
  }
  resolveReadableFileWithin(workflowRoot, authoringPath, '/next/load_paths/0');
  resolveReadableFileWithin(workflowRoot, role.planner, '/next/load_paths/1');
  return [authoringPath, role.planner].map((item) => item.replaceAll('\\', '/'));
}

function validateRoleActivation(manifest, role) {
  if (!role || role.activation !== 'explicit-only' || roleActivationSatisfied(manifest, role)) return;
  const exactDirective = `角色：${role.role_id}`;
  throw new RuntimeWorkflowError(
    'ROLE_EXPLICIT_ACTIVATION_REQUIRED',
    `Role requires the exact standalone directive: ${exactDirective}`,
    '/task_manifest/role_id'
  );
}

function riskAndProfileDiagnostics(taskRisk, executionProfile) {
  const diagnostics = [];
  if (taskRisk.status !== 'assessed') {
    const unresolved = taskRisk.unresolved?.length ? taskRisk.unresolved : ['task-risk-incomplete'];
    for (const reason of unresolved) diagnostics.push(diagnostic('RISK_BLOCKED', '/task_risk', reason));
  }
  if (executionProfile.status !== 'selected') {
    const reasons = executionProfile.reasons?.length ? executionProfile.reasons : ['execution-profile-blocked'];
    for (const reason of reasons) diagnostics.push(diagnostic('PROFILE_BLOCKED', '/execution_profile', reason));
  }
  return diagnostics;
}

function buildLoadPaths(resolution) {
  const ordered = [];
  for (const rule of [...(resolution.rules ?? [])].sort((left, right) => left.load_order - right.load_order)) {
    if (typeof rule.path === 'string') ordered.push(rule.path);
  }
  for (const context of [...(resolution.contexts ?? [])].sort((left, right) => left.context_id.localeCompare(right.context_id))) {
    if (typeof context.path === 'string') ordered.push(context.path);
  }
  const normalized = [...new Set(ordered.map((item) => item.replaceAll('\\', '/')))];
  const executorEntry = typeof resolution.executor_entry === 'string'
    ? resolution.executor_entry.replaceAll('\\', '/')
    : null;
  if (executorEntry && !normalized.includes(executorEntry)) normalized.push(executorEntry);
  return normalized;
}

function preflightDiagnostics(preflight) {
  const diagnostics = [];
  for (let index = 0; index < (preflight.blockers ?? []).length; index += 1) {
    diagnostics.push(diagnostic('PREFLIGHT_BLOCKED', `/preflight/blockers/${index}`, preflight.blockers[index]));
  }
  for (let index = 0; index < (preflight.warnings ?? []).length; index += 1) {
    diagnostics.push(diagnostic('PREFLIGHT_WARNING', `/preflight/warnings/${index}`, preflight.warnings[index]));
  }
  return diagnostics;
}

function buildErrorContext(request, roots, stage) {
  const manifest = request?.task_manifest;
  const projectConfigSummary = {
    available: false,
    module_registry_configured: null,
    module_alias_count: null,
    project_context_count: null
  };
  if (roots?.projectRoot) {
    try {
      const projectConfig = JSON.parse(fs.readFileSync(path.join(roots.projectRoot, 'project.config.json'), 'utf8'));
      projectConfigSummary.available = true;
      projectConfigSummary.module_registry_configured = typeof projectConfig.module_registry === 'string';
      projectConfigSummary.module_alias_count = Object.keys(projectConfig.module_aliases ?? {}).length;
      projectConfigSummary.project_context_count = Array.isArray(projectConfig.project_contexts)
        ? projectConfig.project_contexts.length
        : 0;
    } catch {}
  }
  return {
    stage,
    role_id: typeof manifest?.role_id === 'string' ? manifest.role_id : null,
    action: typeof manifest?.action === 'string' ? manifest.action : null,
    analysis_mode: typeof manifest?.analysis_mode === 'string' ? manifest.analysis_mode : null,
    manifest_status: typeof manifest?.status === 'string' ? manifest.status : null,
    manifest_unresolved: Array.isArray(manifest?.unresolved)
      ? manifest.unresolved.filter((item) => typeof item === 'string')
      : [],
    module_count: Array.isArray(manifest?.modules) ? manifest.modules.length : 0,
    target_count: Array.isArray(manifest?.targets) ? manifest.targets.length : 0,
    project_config: projectConfigSummary
  };
}

function resolveRouting(request, roots) {
  const { role, skills, workflowConfig } = loadRoutingMetadata(roots.workflowRoot, request.task_manifest);
  validateRoleActivation(request.task_manifest, role);
  const taskRisk = assessTaskRisk(request.task_manifest);
  const executionProfile = resolveExecutionProfile(request.task_manifest, taskRisk, role, skills);
  const diagnostics = riskAndProfileDiagnostics(taskRisk, executionProfile);

  if (!role) diagnostics.push(diagnostic('ROLE_UNRESOLVED', '/task_manifest/role_id', 'No active Role matches role_id.'));
  let plannerPaths = null;
  if (diagnostics.length === 0) plannerPaths = validatePlannerPaths(roots.workflowRoot, workflowConfig, role);

  if (diagnostics.length > 0) {
    return {
      result: blockedResult({
        operation: request.operation,
        taskId: request.task_manifest.task_id,
        diagnostics,
        errorContext: buildErrorContext(request, roots, 'risk-and-profile'),
        artifacts: { task_risk: taskRisk, execution_profile: executionProfile, next: null }
      }),
      exitCode: EXIT_CODES.WORKFLOW_BLOCKED
    };
  }

  return {
    result: routingResult({
      taskManifest: request.task_manifest,
      taskRisk,
      executionProfile,
      plannerPaths
    }),
    exitCode: EXIT_CODES.SUCCESS
  };
}

function resolveExecution(request, roots) {
  let pipeline;
  let preflight;
  let executorVerification = null;
  try {
    validateExecutionRegistries(roots.workflowRoot);
    const { role } = loadRoutingMetadata(roots.workflowRoot, request.task_manifest);
    validateRoleActivation(request.task_manifest, role);
    pipeline = runReferencePipeline(request.task_manifest, roots, request.role_plan);
    preflight = preflightReferencePipeline({
      manifest: request.task_manifest,
      taskRisk: pipeline.taskRisk,
      executionProfile: pipeline.executionProfile,
      rolePlan: pipeline.rolePlan,
      resolution: pipeline.resolution,
      context: pipeline.context,
      roots
    });
    if (preflight.can_execute) {
      executorVerification = verifyExecutor({
        resolution: pipeline.resolution,
        preflight,
        taskRisk: pipeline.taskRisk,
        executionProfile: pipeline.executionProfile,
        rolePlan: pipeline.rolePlan,
        roots
      });
    }
  } catch (error) {
    if (isRuntimeFailure(error)) throw error;
    throw new RuntimeWorkflowError('RESOLUTION_FAILED', 'Deterministic Workflow resolution failed.', '/');
  }

  const diagnostics = [
    ...riskAndProfileDiagnostics(pipeline.taskRisk, pipeline.executionProfile),
    ...preflightDiagnostics(preflight)
  ];
  if (executorVerification && !executorVerification.accepted) {
    diagnostics.push(diagnostic('EXECUTION_REJECTED', '/executor_verification', executorVerification.reason));
  }
  const canExecute = preflight.can_execute && executorVerification?.accepted === true;
  const loadPaths = canExecute ? buildLoadPaths(pipeline.resolution) : [];

  if (!canExecute) {
    return {
      result: blockedResult({
        operation: request.operation,
        taskId: request.task_manifest.task_id,
        diagnostics: diagnostics.length > 0
          ? diagnostics
          : [diagnostic('PREFLIGHT_BLOCKED', '/preflight', 'Preflight did not authorize execution.')],
        errorContext: buildErrorContext(request, roots, 'preflight-and-executor'),
        artifacts: {
          task_risk: pipeline.taskRisk,
          execution_profile: pipeline.executionProfile,
          resolved_rule_set: pipeline.resolution,
          preflight,
          executor_verification: executorVerification,
          load_paths: [],
          execution_contract: null,
          fingerprint: pipeline.resolution.fingerprint
        }
      }),
      exitCode: EXIT_CODES.WORKFLOW_BLOCKED
    };
  }

  return {
    result: executionResult({
      taskManifest: request.task_manifest,
      pipeline,
      preflight,
      executorVerification,
      loadPaths,
      diagnostics
    }),
    exitCode: EXIT_CODES.SUCCESS
  };
}

export function runRuntimeRequest(request, roots) {
  if (request.operation === 'resolve-routing') return resolveRouting(request, roots);
  if (request.operation === 'resolve-execution') return resolveExecution(request, roots);
  throw new RuntimeInputError('UNSUPPORTED_OPERATION', 'Unsupported runtime operation.', '/operation');
}

function failureEnvelope(request, roots, stage) {
  return {
    operation: typeof request?.operation === 'string' ? request.operation : null,
    taskId: typeof request?.task_manifest?.task_id === 'string' ? request.task_manifest.task_id : null,
    errorContext: buildErrorContext(request, roots, stage)
  };
}

function inferFailureStage(request, error) {
  const paths = (error?.diagnostics ?? []).map((item) => item?.path).filter((item) => typeof item === 'string');
  if (paths.some((item) => item.startsWith('/role_plan'))) return 'role-plan-validation';
  if (paths.some((item) => item.startsWith('/task_manifest'))) return 'task-manifest-validation';
  if (request?.operation === 'resolve-routing') return 'routing';
  if (request?.operation === 'resolve-execution') return 'execution';
  return 'runtime-boundary';
}

function parseRequestContext(rawInput) {
  try {
    const candidate = JSON.parse(rawInput);
    return candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export async function main(argv = process.argv.slice(2)) {
  let request = null;
  let roots = null;
  let outcome;
  try {
    if (argv.length !== 2 || argv[0] !== '--request-file') {
      throw new RuntimeInputError('INVALID_ARGUMENTS', 'Usage: resolve-task.mjs --request-file <project-relative-json-path>', '/arguments');
    }
    const workflowConfig = readWorkflowJson(DERIVED_WORKFLOW_ROOT, 'workflow.config.json', '/workflow_config');
    const requestDirectory = workflowConfig.runtime?.request_directory;
    if (typeof requestDirectory !== 'string') {
      throw new RuntimeWorkflowError('RUNTIME_CONFIG_INVALID', 'Runtime request directory is not configured.', '/workflow_config/runtime/request_directory');
    }
    const rawInput = readRequestFile(process.cwd(), requestDirectory, argv[1]);
    request = parseRequestContext(rawInput);
    request = parseRuntimeRequest(rawInput);
    roots = resolveRuntimeRoots(request, DERIVED_WORKFLOW_ROOT);
    const projectConfigDiagnostics = inspectProjectConfig(roots.projectRoot);
    outcome = runRuntimeRequest(request, roots);
    outcome.result.diagnostics.push(...projectConfigDiagnostics);
  } catch (error) {
    const context = failureEnvelope(request, roots, inferFailureStage(request, error));
    if (isRuntimeFailure(error)) {
      outcome = {
        result: error.exitCode === EXIT_CODES.INVALID_INPUT
          ? invalidResult({ ...context, diagnostics: error.diagnostics })
          : blockedResult({ ...context, diagnostics: error.diagnostics }),
        exitCode: error.exitCode
      };
      process.stderr.write(`${error.code}: ${error.message}\n`);
    } else {
      outcome = {
        result: internalErrorResult(context),
        exitCode: EXIT_CODES.INTERNAL_ERROR
      };
      process.stderr.write('INTERNAL_ERROR: Runtime failed unexpectedly.\n');
    }
  }

  process.stdout.write(`${JSON.stringify(outcome.result)}\n`);
  process.exitCode = outcome.exitCode;
  return outcome;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) await main();
