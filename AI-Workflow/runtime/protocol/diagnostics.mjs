export const EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  WORKFLOW_BLOCKED: 2,
  INVALID_INPUT: 64,
  INTERNAL_ERROR: 70
});

export function diagnostic(code, path, reason) {
  return {
    code,
    path: path ?? null,
    reason
  };
}

class RuntimeFailure extends Error {
  constructor(message, { code, exitCode, diagnostics = [] }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.diagnostics = diagnostics;
  }
}

export class RuntimeInputError extends RuntimeFailure {
  constructor(code, reason, path = null, diagnostics = null) {
    super(reason, {
      code,
      exitCode: EXIT_CODES.INVALID_INPUT,
      diagnostics: diagnostics ?? [diagnostic(code, path, reason)]
    });
  }
}

export class RuntimeWorkflowError extends RuntimeFailure {
  constructor(code, reason, path = null, diagnostics = null) {
    super(reason, {
      code,
      exitCode: EXIT_CODES.WORKFLOW_BLOCKED,
      diagnostics: diagnostics ?? [diagnostic(code, path, reason)]
    });
  }
}

export function isRuntimeFailure(error) {
  return error instanceof RuntimeFailure;
}
