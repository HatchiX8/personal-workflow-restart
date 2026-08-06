import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TESTS_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const WORKFLOW_ROOT = path.resolve(TESTS_DIRECTORY, '..');
const PROJECT_ROOT = path.resolve(WORKFLOW_ROOT, '..');
const ENTRY = path.join(WORKFLOW_ROOT, 'runtime', 'resolve-task.mjs');

const SCENARIOS = Object.freeze([
  {
    id: 'developer-l1-footer-button',
    prompt: '角色：developer\n在首頁 footer 加上一個沿用既有樣式的按鈕，只修改首頁元件。',
    roleId: 'developer', action: 'develop', expectedRisk: 1, expectedProfile: 'lightweight',
    taskType: 'change', targets: ['frontend'], paths: ['src/pages/Home.jsx'], triggers: [], reviewMode: null
  },
  {
    id: 'developer-l2-footer-component',
    prompt: '角色：developer\n新增共用 Footer 元件並接到首頁，修改首頁與 Footer 兩個檔案。',
    roleId: 'developer', action: 'develop', expectedRisk: 2, expectedProfile: 'standard',
    taskType: 'change', targets: ['frontend'], paths: ['src/pages/Home.jsx', 'src/components/Footer.jsx'], triggers: [], reviewMode: null
  },
  {
    id: 'developer-l3-auth-footer',
    prompt: '角色：developer\n調整登入狀態與首頁 footer 的權限按鈕，涉及 authentication 規則。',
    roleId: 'developer', action: 'develop', expectedRisk: 3, expectedProfile: 'full',
    taskType: 'change', targets: ['frontend'], paths: ['src/pages/Home.jsx'], triggers: ['authentication'], reviewMode: null
  },
  {
    id: 'review-l1-footer-button',
    prompt: '角色：review\nReview 首頁 footer 單一按鈕的修改，只檢查首頁元件。',
    roleId: 'review', action: 'review', expectedRisk: 1, expectedProfile: 'lightweight',
    taskType: 'change', targets: ['frontend'], paths: ['src/pages/Home.jsx'], triggers: [], reviewMode: 'change'
  },
  {
    id: 'review-l2-footer-component',
    prompt: '角色：review\nReview 新增 Footer 元件並接到首頁的修改，檢查兩個相關檔案。',
    roleId: 'review', action: 'review', expectedRisk: 2, expectedProfile: 'standard',
    taskType: 'change', targets: ['frontend'], paths: ['src/pages/Home.jsx', 'src/components/Footer.jsx'], triggers: [], reviewMode: 'change'
  },
  {
    id: 'review-l3-auth-footer',
    prompt: '角色：review\nReview 登入狀態與首頁 footer 權限按鈕的修改，確認 authentication 安全性。',
    roleId: 'review', action: 'review', expectedRisk: 3, expectedProfile: 'full',
    taskType: 'change', targets: ['frontend'], paths: ['src/pages/Home.jsx'], triggers: ['authentication'], reviewMode: 'change'
  }
]);

const provenance = (source, evidence, candidates) => ({ source, confidence: 1, evidence: [evidence], candidates });

function authorManifest(scenario, projectId) {
  return {
    schema_version: '1.0',
    task_id: `acceptance-${scenario.id}`,
    created_at: '2026-08-06T00:00:00.000Z',
    raw_request: scenario.prompt,
    action: scenario.action,
    task_type: scenario.taskType,
    role_id: scenario.roleId,
    skill_ids: [],
    targets: scenario.targets,
    target_mode: 'single',
    project: { project_id: projectId, project_root: '.', config_path: 'project.config.json' },
    modules: [],
    scope: { summary: scenario.prompt.split('\n').at(-1), include_paths: scenario.paths, exclude_paths: [], change_source: 'request' },
    routing_triggers: scenario.triggers,
    review_mode: scenario.reviewMode,
    analysis_mode: null,
    provenance: {
      action: provenance('explicit', `角色與動作：${scenario.roleId}/${scenario.action}`, [scenario.action]),
      task_type: provenance('inference', `任務類型：${scenario.taskType}`, [scenario.taskType]),
      role_id: provenance('explicit', `角色：${scenario.roleId}`, [scenario.roleId]),
      targets: provenance('inference', '首頁與 Footer 屬於 frontend', scenario.targets),
      modules: provenance('inference', '未指定模組', []),
      scope: provenance('explicit', `固定檔案：${scenario.paths.join(', ')}`, scenario.paths),
      routing_triggers: provenance('explicit', scenario.triggers.length ? `風險：${scenario.triggers.join(', ')}` : '沒有高風險觸發', scenario.triggers)
    },
    unresolved: [],
    status: 'analyzed'
  };
}

function authorRolePlan(scenario, manifest, routing) {
  const selectors = [
    `role=${scenario.roleId}`,
    `action=${scenario.action}`,
    `task-type=${scenario.taskType}`,
    ...scenario.targets.map((target) => `target=${target}`),
    ...(scenario.reviewMode ? [`review-mode=${scenario.reviewMode}`] : []),
    ...scenario.triggers.map((trigger) => `risk=${trigger}`)
  ].sort();
  return {
    schema_version: '1.0',
    task_id: manifest.task_id,
    role_id: scenario.roleId,
    action: scenario.action,
    planner_entry: routing.next.load_paths.at(-1),
    facts: [
      { fact_id: 'target', values: scenario.targets, source: 'manifest', confidence: 1, evidence: ['Task Manifest.targets'] },
      { fact_id: 'task-type', values: [scenario.taskType], source: 'manifest', confidence: 1, evidence: ['Task Manifest.task_type'] }
    ],
    skill_selectors: selectors,
    result_reporting: {
      minimum_level: routing.task_risk.level,
      reasons: [`task-risk-level:${routing.task_risk.level}`],
      upward_escalation: true
    },
    validation_profiles: scenario.roleId === 'review' ? ['review-evidence'] : ['lint'],
    context_requirements: [],
    unresolved: [],
    status: 'planned'
  };
}

function runRequest(request, requestRoot) {
  const requestDirectory = fs.mkdtempSync(path.join(requestRoot, 'acceptance-'));
  const requestFile = path.join(requestDirectory, 'request.json');
  fs.writeFileSync(requestFile, JSON.stringify(request), { encoding: 'utf8', flag: 'wx' });
  try {
    const result = spawnSync(process.execPath, [ENTRY, '--request-file', path.relative(PROJECT_ROOT, requestFile)], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
      timeout: 15_000
    });
    let json = null;
    try { json = JSON.parse((result.stdout ?? '').trim()); } catch {}
    return { exitCode: result.status, stderr: result.stderr ?? '', json };
  } finally {
    fs.rmSync(requestDirectory, { recursive: true, force: true });
  }
}

export function runSixScenarioAcceptance(assertion = (condition, message) => {
  if (!condition) throw new Error(message);
}) {
  const projectConfig = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'project.config.json'), 'utf8'));
  const requestRoot = path.join(PROJECT_ROOT, '.ai-workflow', 'runtime', 'requests');
  fs.mkdirSync(requestRoot, { recursive: true });
  const results = [];

  for (const scenario of SCENARIOS) {
    const manifest = authorManifest(scenario, projectConfig.project_id);
    const routing = runRequest({
      protocol_version: '1.0', operation: 'resolve-routing', project_root: PROJECT_ROOT, task_manifest: manifest
    }, requestRoot);
    assertion(routing.exitCode === 0 && routing.json?.status === 'resolved', `${scenario.id}: Routing failed: ${routing.stderr}`);
    assertion(routing.json?.task_risk?.level === scenario.expectedRisk, `${scenario.id}: expected L${scenario.expectedRisk}`);
    assertion(routing.json?.execution_profile?.profile_id === scenario.expectedProfile, `${scenario.id}: profile mismatch`);
    assertion(
      JSON.stringify(routing.json?.next?.load_paths) === JSON.stringify([
        'orchestration/role-plan-authoring.md',
        `roles/${scenario.roleId}/planner.md`
      ]),
      `${scenario.id}: Role Plan contract or planner path missing`
    );

    const rolePlan = authorRolePlan(scenario, manifest, routing.json);
    const execution = runRequest({
      protocol_version: '1.0', operation: 'resolve-execution', project_root: PROJECT_ROOT, task_manifest: manifest, role_plan: rolePlan
    }, requestRoot);
    assertion(execution.exitCode === 0 && execution.json?.status === 'ready', `${scenario.id}: Execution failed: ${execution.stderr}`);
    assertion(execution.json?.preflight?.can_execute === true, `${scenario.id}: Preflight did not pass`);
    assertion(execution.json?.executor_verification?.accepted === true, `${scenario.id}: Executor verification failed`);
    assertion(execution.json?.resolved_rule_set?.role_id === scenario.roleId, `${scenario.id}: role mismatch`);
    assertion((execution.json?.load_paths ?? []).length > 0, `${scenario.id}: load_paths is empty`);
    assertion(!fs.readdirSync(requestRoot).some((name) => name.startsWith('acceptance-')), `${scenario.id}: request file was not cleaned`);
    results.push({
      scenario: scenario.id,
      role: scenario.roleId,
      risk_level: execution.json.task_risk.level,
      profile: execution.json.execution_profile.profile_id,
      status: execution.json.status,
      preflight: execution.json.preflight.can_execute,
      rules: execution.json.resolved_rule_set.rules.length,
      load_paths: execution.json.load_paths.length
    });
  }
  return results;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  const results = runSixScenarioAcceptance();
  process.stdout.write(`${JSON.stringify({ status: 'passed', scenarios: results }, null, 2)}${os.EOL}`);
}
