import { PROTOCOL_VERSION } from './request.mjs';

export function baseResult({ operation = null, status, taskId = null, diagnostics = [] }) {
  return {
    protocol_version: PROTOCOL_VERSION,
    operation,
    status,
    task_id: taskId,
    diagnostics
  };
}

export function invalidResult({ operation = null, taskId = null, diagnostics }) {
  return {
    ...baseResult({ operation, status: 'invalid', taskId, diagnostics }),
    error_code: diagnostics[0]?.code ?? 'INVALID_INPUT'
  };
}

export function blockedResult({ operation, taskId = null, diagnostics, artifacts = {} }) {
  return {
    ...baseResult({ operation, status: 'blocked', taskId, diagnostics }),
    error_code: diagnostics[0]?.code ?? 'WORKFLOW_BLOCKED',
    ...artifacts
  };
}

export function internalErrorResult({ operation = null, taskId = null }) {
  return {
    ...baseResult({
      operation,
      status: 'error',
      taskId,
      diagnostics: [{ code: 'INTERNAL_ERROR', path: null, reason: 'Runtime failed unexpectedly.' }]
    }),
    error_code: 'INTERNAL_ERROR'
  };
}

export function routingResult({ taskManifest, taskRisk, executionProfile, plannerPath, diagnostics = [] }) {
  return {
    ...baseResult({
      operation: 'resolve-routing',
      status: 'resolved',
      taskId: taskManifest.task_id,
      diagnostics
    }),
    task_risk: taskRisk,
    execution_profile: executionProfile,
    next: {
      stage: 'role-planner',
      load_paths: [plannerPath]
    }
  };
}

export function executionResult({ taskManifest, pipeline, preflight, executorVerification, loadPaths, diagnostics = [] }) {
  return {
    ...baseResult({
      operation: 'resolve-execution',
      status: 'ready',
      taskId: taskManifest.task_id,
      diagnostics
    }),
    task_risk: pipeline.taskRisk,
    execution_profile: pipeline.executionProfile,
    resolved_rule_set: pipeline.resolution,
    preflight,
    executor_verification: executorVerification,
    load_paths: loadPaths,
    execution_contract: preflight.execution_contract,
    fingerprint: pipeline.resolution.fingerprint
  };
}
