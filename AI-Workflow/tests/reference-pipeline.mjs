import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const sha256 = (bytes) => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function isPathWithin(basePath, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) return false;
  const base = path.resolve(basePath);
  const resolved = path.resolve(base, relativePath);
  return resolved === base || resolved.startsWith(`${base}${path.sep}`);
}

export function resolveResourcePath(roots, pathBase, relativePath) {
  const base = pathBase === 'project_root' ? roots.projectRoot : roots.workflowRoot;
  if (!['workflow_root', 'project_root'].includes(pathBase) || !isPathWithin(base, relativePath)) {
    throw new Error(`Path escapes ${pathBase}: ${relativePath}`);
  }
  return path.resolve(base, relativePath);
}

export function hashSnapshotSource(workflowRoot, entry) {
  const absolutePath = resolveResourcePath({ workflowRoot, projectRoot: workflowRoot }, 'workflow_root', entry.path);
  const fileHash = (filePath) => sha256(fs.readFileSync(filePath));
  if (entry.kind === 'file') return fileHash(absolutePath);
  if (entry.kind !== 'directory') throw new Error(`Unsupported snapshot kind: ${entry.kind}`);

  const files = [];
  const walk = (directory) => {
    for (const child of fs.readdirSync(directory, { withFileTypes: true })) {
      const current = path.join(directory, child.name);
      if (child.isDirectory()) walk(current);
      else if (child.isFile()) {
        files.push({
          path: path.relative(absolutePath, current).replaceAll('\\', '/'),
          content_hash: fileHash(current)
        });
      }
    }
  };
  walk(absolutePath);
  files.sort((left, right) => left.path.localeCompare(right.path));
  return sha256(Buffer.from(stableJson(files)));
}

export function validateRegistrySnapshot(workflowRoot, registry) {
  const snapshot = registry.source_snapshot;
  if (!snapshot || snapshot.algorithm !== 'sha256' || !Array.isArray(snapshot.files)) {
    return [`${registry.registry_id}: missing source_snapshot`];
  }
  const errors = [];
  const calculated = [];
  for (const entry of snapshot.files) {
    try {
      const contentHash = hashSnapshotSource(workflowRoot, entry);
      calculated.push({ path: entry.path, kind: entry.kind, content_hash: contentHash });
      if (contentHash !== entry.content_hash) errors.push(`${registry.registry_id}: source drift at ${entry.path}`);
    } catch (error) {
      errors.push(`${registry.registry_id}: cannot hash ${entry.path} (${error.message})`);
    }
  }
  calculated.sort((left, right) => left.path.localeCompare(right.path));
  const fingerprint = sha256(Buffer.from(stableJson(calculated)));
  if (fingerprint !== snapshot.fingerprint) errors.push(`${registry.registry_id}: source snapshot fingerprint drift`);
  return errors;
}

const readJson = (absolutePath) => JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
const conditionMatches = (condition, manifest) => {
  if (condition === 'resolved-role') return Boolean(manifest.role_id);
  if (condition === 'developer-task-complete') return manifest.action === 'develop';
  const [key, value] = condition.split('=', 2);
  if (!value) return (manifest.routing_triggers ?? []).includes(condition);
  if (key === 'role') return manifest.role_id === value;
  if (key === 'target') return (manifest.targets ?? []).includes(value);
  if (['task_type', 'task-type'].includes(key)) return manifest.task_type === value;
  if (['review_mode', 'review-mode'].includes(key)) return manifest.review_mode === value;
  if (['analysis_mode', 'analysis-mode'].includes(key)) return manifest.analysis_mode === value;
  if (key === 'runtime') return (manifest.routing_triggers ?? []).includes(`runtime=${value}`);
  return false;
};

const triggersMatch = (item, manifest, defaultMode = 'any') => {
  const triggers = item.triggers ?? [];
  if (triggers.length === 0) return false;
  const matches = triggers.map((trigger) => conditionMatches(trigger, manifest));
  return (item.trigger_mode ?? defaultMode) === 'all' ? matches.every(Boolean) : matches.some(Boolean);
};

export function deriveResultReporting(manifest) {
  const routingTriggers = new Set(
    (manifest.routing_triggers ?? []).map((trigger) =>
      trigger.startsWith('risk=') ? trigger.slice('risk='.length) : trigger
    )
  );
  const includePaths = manifest.scope?.include_paths ?? [];
  const moduleCount = manifest.modules?.length ?? 0;
  const scopeMode = manifest.scope?.change_source === 'full-project'
    ? 'full-project'
    : moduleCount > 1
      ? 'cross-module'
      : moduleCount === 1
        ? 'module'
        : includePaths.length === 1
          ? 'file'
          : 'unknown';
  const highRiskFacts = new Set([
    'architecture', 'database', 'database-schema', 'data-migration', 'migration',
    'public-api-contract', 'authentication', 'authorization', 'security',
    'payment', 'monetary-flow', 'destructive-operation', 'file-delete', 'rollback'
  ]);
  const matchedHighRisks = [...routingTriggers].filter((risk) => highRiskFacts.has(risk));
  const detailedReportRequested = /完整報告|詳細(?:報告|說明)|設計決策|風險評估|full report|design decisions|risk assessment/iu
    .test(manifest.raw_request ?? '');
  const level3Reasons = [];
  if (['cross-module', 'full-project'].includes(scopeMode)) level3Reasons.push(`scope-mode=${scopeMode}`);
  if (['fullstack', 'mixed'].includes(manifest.target_mode)) level3Reasons.push(`target-mode=${manifest.target_mode}`);
  if (manifest.task_type === 'migration') level3Reasons.push('task-type=migration');
  level3Reasons.push(...matchedHighRisks.map((risk) => `risk=${risk}`));
  if (detailedReportRequested) level3Reasons.push('explicit-detailed-report-request');
  if (level3Reasons.length > 0) {
    return { minimum_level: 3, reasons: [...new Set(level3Reasons)], upward_escalation: true };
  }

  const level1TaskType = ['change', 'bugfix', 'maintenance'].includes(manifest.task_type);
  const singleTarget = (manifest.targets ?? []).length === 1;
  if (scopeMode === 'file' && singleTarget && level1TaskType) {
    return {
      minimum_level: 1,
      reasons: ['scope-mode=file', `task-type=${manifest.task_type}`, 'single-target'],
      upward_escalation: true
    };
  }

  return {
    minimum_level: 2,
    reasons: [scopeMode === 'unknown' ? 'scope-size-not-confirmed' : 'default-general-task'],
    upward_escalation: true
  };
}

export function buildReferenceRolePlan(manifest, role) {
  const skillSelectors = new Set([
    `role=${manifest.role_id}`,
    `action=${manifest.action}`,
    `task-type=${manifest.task_type}`
  ]);
  for (const target of manifest.targets ?? []) skillSelectors.add(`target=${target}`);
  if (manifest.review_mode) skillSelectors.add(`review-mode=${manifest.review_mode}`);
  if (manifest.analysis_mode) skillSelectors.add(`analysis-mode=${manifest.analysis_mode}`);
  for (const trigger of manifest.routing_triggers ?? []) {
    skillSelectors.add(trigger.includes('=') ? trigger : `risk=${trigger}`);
  }

  const fact = (factId, values) => ({
    fact_id: factId,
    values,
    source: 'manifest',
    confidence: 1,
    evidence: [`Task Manifest.${factId}`]
  });
  const facts = [
    fact('target', manifest.targets ?? []),
    fact('task-type', [manifest.task_type])
  ].filter((item) => item.values.length > 0);

  const unresolved = [];
  if (!role?.planner) unresolved.push('role-planner-missing');
  return {
    schema_version: '1.0',
    task_id: manifest.task_id,
    role_id: manifest.role_id,
    action: manifest.action,
    planner_entry: role?.planner ?? 'unresolved',
    facts,
    skill_selectors: [...skillSelectors].sort(),
    result_reporting: deriveResultReporting(manifest),
    validation_profiles: [],
    context_requirements: manifest.modules?.length ? ['module'] : [],
    unresolved,
    status: unresolved.length ? 'needs-resolution' : 'planned'
  };
}

const selectorsMatch = (skill, rolePlan, manifest) => {
  const facts = new Set(rolePlan.skill_selectors ?? []);
  const selectors = skill.selectors ?? { all: [], any: [], none: [] };
  if (!(selectors.all ?? []).every((selector) => facts.has(selector))) return false;
  if ((selectors.any ?? []).length > 0 && !(selectors.any ?? []).some((selector) => facts.has(selector))) return false;
  if ((selectors.none ?? []).some((selector) => facts.has(selector))) return false;
  const projectIds = skill.scopes?.project_ids ?? [];
  const moduleIds = skill.scopes?.module_ids ?? [];
  if (projectIds.length > 0 && !projectIds.includes(manifest.project?.project_id)) return false;
  if (
    moduleIds.length > 0 &&
    !(manifest.modules ?? []).some((module) =>
      moduleIds.includes(module.module_id ?? module.name)
    )
  ) return false;
  return true;
};

const canonicalFingerprint = (resolution) => {
  const payload = {
    task_id: resolution.task_id,
    role_id: resolution.role_id,
    executor_entry: resolution.executor_entry,
    rules: [...resolution.rules].sort((left, right) => left.load_order - right.load_order).map(({ content_hash, ...rule }) => ({ ...rule, content_hash })),
    contexts: [...resolution.contexts].sort((left, right) => left.context_id.localeCompare(right.context_id)),
    dependencies: [...resolution.dependencies].sort(),
    conflicts: [...resolution.conflicts].sort(),
    unresolved: [...resolution.unresolved].sort(),
    status: resolution.status
  };
  return sha256(Buffer.from(stableJson(payload)));
};

const topologicalOrder = (selected, dependencies) => {
  const remaining = new Map();
  const dependents = new Map();
  for (const id of selected) {
    const localDependencies = [...(dependencies.get(id) ?? [])].filter((dependency) => selected.has(dependency));
    remaining.set(id, new Set(localDependencies));
    for (const dependency of localDependencies) {
      if (!dependents.has(dependency)) dependents.set(dependency, new Set());
      dependents.get(dependency).add(id);
    }
  }
  const ordered = [];
  const ready = [...selected].filter((id) => remaining.get(id).size === 0).sort();
  while (ready.length > 0) {
    const id = ready.shift();
    ordered.push(id);
    for (const dependent of [...(dependents.get(id) ?? [])].sort()) {
      remaining.get(dependent).delete(id);
      if (remaining.get(dependent).size === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }
  if (ordered.length !== selected.size) throw new Error('Inclusion dependency cycle detected during load-order calculation');
  return ordered;
};

const contextRequired = (projectConfig, manifest, context) => {
  const moduleAnalysis = manifest.action === 'analyze' && manifest.analysis_mode === 'module';
  if (moduleAnalysis) return false;
  const policy = projectConfig.context_policy ?? {};
  const highRisk = new Set(policy.high_risk_conditions ?? []);
  const riskFacts = new Set([
    manifest.task_type,
    ...(manifest.routing_triggers ?? []),
    ...(manifest.targets ?? []),
    ...(manifest.modules ?? []).length > 1 ? ['cross-module'] : []
  ]);
  const isHighRisk = [...riskFacts].some((fact) => highRisk.has(fact));
  if (isHighRisk) return true;
  if (context.type === 'module') {
    return ['develop', 'review'].includes(manifest.action) || manifest.analysis_mode === 'module';
  }
  return (policy.require_project_context_for ?? []).includes(manifest.action)
    || (context.required_for ?? []).includes(manifest.action);
};

export function resolveContexts({ manifest, projectConfig, modulesRegistry, roots, projectContexts = null }) {
  const result = { contexts: [], warnings: [], blockers: [] };
  const moduleAnalysis = manifest.action === 'analyze' && manifest.analysis_mode === 'module';
  const verifiedProjectId = projectConfig.project_id;
  if (manifest.project?.project_id !== verifiedProjectId) {
    result.blockers.push('project-id-mismatch');
    return result;
  }
  if (!isPathWithin(roots.projectRoot, manifest.project?.project_root ?? '.')) {
    result.blockers.push('project-root-path-invalid');
    return result;
  }

  const addContext = (candidate, type, moduleId = null) => {
    const pathBase = candidate.path_base ?? (type === 'project' ? 'project_root' : 'workflow_root');
    let absolutePath;
    try {
      absolutePath = resolveResourcePath(roots, pathBase, candidate.path);
    } catch (error) {
      result.blockers.push(`context-path-invalid:${candidate.context_id}`);
      return;
    }
    if (!fs.existsSync(absolutePath)) {
      result.blockers.push(`context-path-missing:${candidate.context_id}`);
      return;
    }
    const context = {
      context_id: candidate.context_id,
      type,
      project_id: verifiedProjectId,
      module_id: moduleId,
      targets: candidate.targets ?? (candidate.target ? [candidate.target] : []),
      path_base: pathBase,
      path: candidate.path,
      required: false,
      status: candidate.status,
      reason: '',
      content_hash: sha256(fs.readFileSync(absolutePath))
    };
    context.required = contextRequired(projectConfig, manifest, context);
    context.reason = context.required
      ? `${type} Context is required by explicit policy or task risk`
      : `${type} Context is an explicit current optional Context`;
    const highRisk = new Set(projectConfig.context_policy?.high_risk_conditions ?? []);
    const riskFacts = new Set([manifest.task_type, ...(manifest.routing_triggers ?? []), ...(manifest.targets ?? [])]);
    const risky = [...riskFacts].some((fact) => highRisk.has(fact));
    if (['stale', 'partial', 'unknown'].includes(context.status)) {
      if (context.required || (risky && !moduleAnalysis)) result.blockers.push(`context-status-blocked:${context.context_id}:${context.status}`);
      else result.warnings.push(`context-status-warning:${context.context_id}:${context.status}`);
    }
    result.contexts.push(context);
  };

  const configuredProjectContexts = projectContexts ?? projectConfig.project_contexts ?? [];
  const eligibleProjectContexts = configuredProjectContexts
    .filter((context) => context && typeof context === 'object' && context.current === true)
    .filter((context) => !Array.isArray(context.targets) || context.targets.length === 0 || context.targets.some((target) => (manifest.targets ?? []).includes(target)));
  const projectMustExist = (projectConfig.context_policy?.require_project_context_for ?? []).includes(manifest.action);
  if (eligibleProjectContexts.length > 1) result.blockers.push('project-context-conflict');
  else if (eligibleProjectContexts.length === 1) addContext(eligibleProjectContexts[0], 'project');
  else if (projectMustExist) result.blockers.push('required-project-context-missing');

  for (const requested of manifest.modules ?? []) {
    const requestedId = requested.module_id ?? requested.name;
    const direct = (modulesRegistry.modules ?? []).filter((module) => module.module_id === requestedId);
    const aliases = direct.length ? direct : (modulesRegistry.modules ?? []).filter((module) => (module.aliases ?? []).includes(requestedId));
    if (aliases.length !== 1) {
      result.blockers.push(`module-ambiguous-or-missing:${requestedId}`);
      continue;
    }
    const module = aliases[0];
    if (!(module.project_bindings ?? []).includes(verifiedProjectId)) {
      (moduleAnalysis ? result.warnings : result.blockers).push(`module-unbound:${module.module_id}`);
      continue;
    }
    const pointer = module.context_selection?.current_context;
    if (!pointer || typeof pointer !== 'object') {
      (moduleAnalysis ? result.warnings : result.blockers).push(`module-current-context-missing:${module.module_id}`);
      continue;
    }
    for (const target of manifest.targets ?? []) {
      const contextId = pointer[target];
      const candidates = (module.context_candidates ?? []).filter((candidate) => candidate.context_id === contextId);
      if (candidates.length !== 1) {
        (moduleAnalysis ? result.warnings : result.blockers).push(`module-context-pointer-conflict:${module.module_id}:${target}`);
        continue;
      }
      const candidate = candidates[0];
      if (candidate.project_id !== verifiedProjectId) {
        (moduleAnalysis ? result.warnings : result.blockers).push(`context-cross-project:${candidate.context_id}`);
        continue;
      }
      if (candidate.module_id && candidate.module_id !== module.module_id) {
        (moduleAnalysis ? result.warnings : result.blockers).push(`context-module-mismatch:${candidate.context_id}`);
        continue;
      }
      if (candidate.target !== target || candidate.current !== true || candidate.binding_status !== 'bound') {
        (moduleAnalysis ? result.warnings : result.blockers).push(`context-not-current-or-compatible:${candidate.context_id}`);
        continue;
      }
      addContext(candidate, 'module', module.module_id);
    }
  }
  return result;
}

export function runReferencePipeline(manifest, roots, providedRolePlan = null) {
  const workflowConfig = readJson(path.join(roots.workflowRoot, 'workflow.config.json'));
  const projectConfig = readJson(path.join(roots.projectRoot, 'project.config.json'));
  const roles = readJson(path.join(roots.workflowRoot, workflowConfig.registries.roles));
  const skills = readJson(path.join(roots.workflowRoot, workflowConfig.registries.skills));
  const bundles = readJson(path.join(roots.workflowRoot, workflowConfig.registries.rule_bundles));
  const modules = readJson(path.join(roots.workflowRoot, workflowConfig.registries.modules));
  const unresolved = [...(manifest.unresolved ?? [])];
  const conflicts = [];
  const selected = new Set();
  const reasons = new Map();
  const dependencies = new Map();
  const ruleById = new Map((bundles.rules ?? []).map((rule) => [rule.rule_id, rule]));
  const skillById = new Map((skills.skills ?? []).map((skill) => [skill.skill_id, skill]));
  const bundleById = new Map((bundles.bundles ?? []).map((bundle) => [bundle.bundle_id, bundle]));
  const role = (roles.roles ?? []).find((item) => item.role_id === manifest.role_id && item.status === 'active');
  if (!role) unresolved.push('role-unresolved');
  const rolePlan = providedRolePlan ?? buildReferenceRolePlan(manifest, role);
  if (rolePlan.status !== 'planned') unresolved.push(...(rolePlan.unresolved ?? ['role-plan-incomplete']));
  if (rolePlan.role_id !== manifest.role_id || rolePlan.action !== manifest.action) {
    unresolved.push('role-plan-task-mismatch');
  }
  if (role && rolePlan.planner_entry !== role.planner) unresolved.push('role-planner-entry-mismatch');

  const includeResource = (id, reason, trail = []) => {
    if (trail.includes(id)) throw new Error(`Inclusion dependency cycle: ${[...trail, id].join(' -> ')}`);
    const item = ruleById.get(id) ?? skillById.get(id);
    if (!item || item.status !== 'active') {
      unresolved.push(`inactive-or-missing:${id}`);
      return;
    }
    if (skillById.has(id) && item.role_id !== manifest.role_id) {
      const parentId = trail.at(-1);
      unresolved.push(parentId && skillById.has(parentId)
        ? `skill-dependency-role-incompatible:${parentId}:${id}`
        : `skill-role-incompatible:${id}`);
      return;
    }
    if (ruleById.has(id) && /(^|\/)readme\.md$/i.test(item.path)) {
      unresolved.push(`readme-not-an-execution-rule:${id}`);
      return;
    }
    if (!selected.has(id)) {
      selected.add(id);
      reasons.set(id, reason);
      dependencies.set(id, new Set(item.dependencies ?? []));
      for (const dependency of item.dependencies ?? []) includeResource(dependency, `inclusion dependency of ${id}`, [...trail, id]);
    }
  };

  const includeBundle = (id, reason, trail = []) => {
    if (trail.includes(`bundle:${id}`)) throw new Error(`Bundle inclusion cycle: ${[...trail, `bundle:${id}`].join(' -> ')}`);
    const bundle = bundleById.get(id);
    if (!bundle || bundle.status !== 'active') {
      unresolved.push(`inactive-or-missing-bundle:${id}`);
      return;
    }
    for (const dependency of bundle.dependencies ?? []) {
      if (bundleById.has(dependency)) includeBundle(dependency, `bundle dependency ${id}`, [...trail, `bundle:${id}`]);
      else includeResource(dependency, `bundle dependency ${id}`, [...trail, `bundle:${id}`]);
    }
    for (const ruleId of bundle.rule_ids ?? []) includeResource(ruleId, reason, [...trail, `bundle:${id}`]);
  };

  if (role) {
    for (const bundleId of role.required_bundle_ids ?? []) includeBundle(bundleId, `required bundle for ${role.role_id}`);
    for (const bundleId of role.optional_bundle_ids ?? []) {
      const bundle = bundleById.get(bundleId);
      if (bundle && triggersMatch(bundle, manifest, bundles.dependency_contract?.default_trigger_mode ?? 'any')) includeBundle(bundleId, `triggered bundle ${bundleId}`);
    }
  }

  for (const rule of bundles.rules ?? []) {
    if (rule.status !== 'active' || rule.category === 'bootstrap' || rule.load_policy !== 'conditional') continue;
    if (triggersMatch(rule, manifest, bundles.dependency_contract?.default_trigger_mode ?? 'any')) includeResource(rule.rule_id, `triggered rule ${rule.rule_id}`);
  }
  for (const skillId of manifest.skill_ids ?? []) includeResource(skillId, `explicit skill ${skillId}`);
  for (const skill of skills.skills ?? []) {
    if (
      skill.status !== 'active' ||
      skill.role_id !== manifest.role_id ||
      !['conditional', 'explicit_or_conditional'].includes(skill.load_policy)
    ) continue;
    if (selectorsMatch(skill, rolePlan, manifest)) {
      includeResource(skill.skill_id, `Role Plan selector matched ${skill.skill_id}`);
    }
  }

  for (const skill of skills.skills ?? []) {
    if (!selected.has(skill.skill_id)) continue;
    for (const conflict of skill.conflicts ?? []) {
      if (selected.has(conflict)) conflicts.push(`${skill.skill_id}<->${conflict}`);
    }
  }
  if (conflicts.length > 0) unresolved.push('skill-conflict');

  const selectedDependencies = new Map([...dependencies.entries()].map(([id, values]) => [id, [...values]]));
  let ordered = [];
  try {
    ordered = topologicalOrder(selected, selectedDependencies);
  } catch (error) {
    unresolved.push(error.message);
  }
  const contextsResult = resolveContexts({ manifest, projectConfig, modulesRegistry: modules, roots });
  unresolved.push(...contextsResult.blockers);
  const rules = ordered.map((id, loadOrder) => {
    const source = ruleById.get(id) ?? skillById.get(id);
    const category = skillById.has(id) ? 'skill' : source.category;
    const absolutePath = resolveResourcePath(roots, 'workflow_root', source.path);
    return {
      rule_id: id,
      category,
      path: source.path,
      required: source.required === true || skillById.has(id),
      load_order: loadOrder,
      precedence_rank: source.precedence?.rank ?? 0,
      reason: reasons.get(id),
      registry_source: skillById.has(id) ? 'registry/skills.json' : 'registry/rule-bundles.json',
      content_hash: sha256(fs.readFileSync(absolutePath))
    };
  });
  const resolution = {
    schema_version: '1.0',
    resolution_id: `reference-${manifest.task_id}`,
    task_id: manifest.task_id,
    generated_at: '2000-01-01T00:00:00Z',
    role_id: role?.role_id ?? 'unresolved',
    executor_entry: role?.entry ?? 'unresolved',
    rules,
    contexts: contextsResult.contexts,
    dependencies: [...selectedDependencies.entries()].flatMap(([id, values]) => values.map((dependency) => `${id}->${dependency}`)).sort(),
    conflicts,
    unresolved: [...new Set(unresolved)].sort(),
    fingerprint: '',
    status: unresolved.length === 0 ? 'resolved' : 'incomplete'
  };
  resolution.fingerprint = canonicalFingerprint(resolution);
  return { resolution, context: contextsResult, rolePlan, registries: { roles, skills, bundles, modules }, workflowConfig, projectConfig };
}

export function preflightReferencePipeline({ manifest, rolePlan, resolution, context, roots }) {
  const checks = [];
  const blockers = [...resolution.unresolved, ...context.blockers];
  const warnings = [...context.warnings];
  if (!rolePlan?.result_reporting) blockers.push('result-reporting-missing');
  if (rolePlan && (rolePlan.role_id !== manifest.role_id || rolePlan.action !== manifest.action)) {
    blockers.push('role-plan-routing-mismatch');
  }
  try {
    const workflowConfig = readJson(path.join(roots.workflowRoot, 'workflow.config.json'));
    const skillRegistry = readJson(path.join(roots.workflowRoot, workflowConfig.registries.skills));
    const skillById = new Map((skillRegistry.skills ?? []).map((skill) => [skill.skill_id, skill]));
    for (const rule of resolution.rules.filter((item) => item.category === 'skill')) {
      const skill = skillById.get(rule.rule_id);
      if (!skill || skill.role_id !== resolution.role_id) blockers.push(`skill-role-mismatch:${rule.rule_id}`);
    }
  } catch {
    blockers.push('skill-registry-unavailable');
  }
  const verifyResource = (resource, pathBase, label) => {
    try {
      const absolutePath = resolveResourcePath(roots, pathBase, resource.path);
      const contentHash = sha256(fs.readFileSync(absolutePath));
      if (contentHash !== resource.content_hash) blockers.push(`${label}-hash-mismatch:${resource.rule_id ?? resource.context_id}`);
    } catch (error) {
      blockers.push(`${label}-path-invalid:${resource.rule_id ?? resource.context_id}`);
    }
  };
  for (const rule of resolution.rules) verifyResource(rule, 'workflow_root', 'rule');
  for (const contextRecord of resolution.contexts) verifyResource(contextRecord, contextRecord.path_base, 'context');
  if (resolution.status !== 'resolved') blockers.push('resolution-incomplete');
  if (canonicalFingerprint(resolution) !== resolution.fingerprint) blockers.push('resolution-fingerprint-mismatch');
  checks.push({ check_id: 'resolution', status: blockers.length ? 'failed' : 'pass', subject: resolution.resolution_id, message: blockers.length ? 'Resolution has blockers.' : 'Resolution is frozen.', path: null });
  const status = blockers.length ? 'BLOCKED' : warnings.length ? 'PASS_WITH_WARNINGS' : 'PASS';
  const executionContract = status === 'BLOCKED' ? null : {
    role_id: resolution.role_id,
    executor_entry: resolution.executor_entry,
    rule_set_fingerprint: resolution.fingerprint,
    allowed_action: manifest.action,
    result_reporting: rolePlan.result_reporting
  };
  return {
    schema_version: '1.0',
    task_id: manifest.task_id,
    resolution_id: resolution.resolution_id,
    checked_at: '2000-01-01T00:00:00Z',
    status,
    can_execute: status !== 'BLOCKED',
    checks,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    execution_contract: executionContract
  };
}

export function verifyExecutor({ resolution, preflight, rolePlan, roots, readBytes = fs.readFileSync }) {
  if (!preflight?.can_execute || !preflight.execution_contract) return { accepted: false, reason: 'preflight-not-executable' };
  if (preflight.execution_contract.rule_set_fingerprint !== resolution.fingerprint) return { accepted: false, reason: 'preflight-fingerprint-mismatch' };
  if (JSON.stringify(preflight.execution_contract.result_reporting) !== JSON.stringify(rolePlan?.result_reporting)) {
    return { accepted: false, reason: 'result-reporting-contract-mismatch' };
  }
  const verifyResource = (resource, pathBase) => {
    try {
      const absolutePath = resolveResourcePath(roots, pathBase, resource.path);
      return sha256(readBytes(absolutePath)) === resource.content_hash;
    } catch {
      return false;
    }
  };
  for (const rule of resolution.rules) if (!verifyResource(rule, 'workflow_root')) return { accepted: false, reason: `rule-hash-mismatch:${rule.rule_id}` };
  for (const contextRecord of resolution.contexts) if (!verifyResource(contextRecord, contextRecord.path_base)) return { accepted: false, reason: `context-hash-mismatch:${contextRecord.context_id}` };
  if (canonicalFingerprint(resolution) !== resolution.fingerprint) return { accepted: false, reason: 'resolution-fingerprint-mismatch' };
  return { accepted: true, reason: 'accepted' };
}
