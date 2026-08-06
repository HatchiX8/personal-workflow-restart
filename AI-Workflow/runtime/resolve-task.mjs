#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  assessTaskRisk,
  preflightReferencePipeline,
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

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8');
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
  return { role, skills };
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

function validatePlannerPath(workflowRoot, role) {
  if (!role || typeof role.planner !== 'string') {
    throw new RuntimeWorkflowError('ROLE_PLANNER_UNRESOLVED', 'The active Role has no planner entry.', '/task_manifest/role_id');
  }
  resolveReadableFileWithin(workflowRoot, role.planner, '/next/load_paths/0');
  return role.planner.replaceAll('\\', '/');
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

function resolveRouting(request, roots) {
  const { role, skills } = loadRoutingMetadata(roots.workflowRoot, request.task_manifest);
  const taskRisk = assessTaskRisk(request.task_manifest);
  const executionProfile = resolveExecutionProfile(request.task_manifest, taskRisk, role, skills);
  const diagnostics = riskAndProfileDiagnostics(taskRisk, executionProfile);

  if (!role) diagnostics.push(diagnostic('ROLE_UNRESOLVED', '/task_manifest/role_id', 'No active Role matches role_id.'));
  let plannerPath = null;
  if (diagnostics.length === 0) plannerPath = validatePlannerPath(roots.workflowRoot, role);

  if (diagnostics.length > 0) {
    return {
      result: blockedResult({
        operation: request.operation,
        taskId: request.task_manifest.task_id,
        diagnostics,
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
      plannerPath
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

function errorContext(request) {
  return {
    operation: typeof request?.operation === 'string' ? request.operation : null,
    taskId: typeof request?.task_manifest?.task_id === 'string' ? request.task_manifest.task_id : null
  };
}

export async function main(argv = process.argv.slice(2)) {
  let request = null;
  let outcome;
  try {
    if (argv.length !== 1 || argv[0] !== '--stdin') {
      throw new RuntimeInputError('INVALID_ARGUMENTS', 'Usage: resolve-task.mjs --stdin', '/arguments');
    }
    request = parseRuntimeRequest(await readStdin());
    const roots = resolveRuntimeRoots(request, DERIVED_WORKFLOW_ROOT);
    outcome = runRuntimeRequest(request, roots);
  } catch (error) {
    const context = errorContext(request);
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
