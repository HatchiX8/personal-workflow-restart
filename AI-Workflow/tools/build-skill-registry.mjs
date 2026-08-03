import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workflowRoot = path.resolve(import.meta.dirname, '..');
const rolesRoot = path.join(workflowRoot, 'roles');
const outputPath = path.join(workflowRoot, 'registry', 'skills.json');
const checkOnly = process.argv.includes('--check');

const toRelative = (absolutePath) =>
  path.relative(workflowRoot, absolutePath).replaceAll('\\', '/');

const sha256 = (bytes) =>
  `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const listFiles = (directory, fileName) => {
  const results = [];
  for (const child of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, child.name);
    if (child.isDirectory()) results.push(...listFiles(absolutePath, fileName));
    if (child.isFile() && child.name === fileName) results.push(absolutePath);
  }
  return results;
};

const fail = (message) => {
  throw new Error(message);
};

const assertArray = (value, field, manifestPath) => {
  if (!Array.isArray(value)) fail(`${manifestPath}: ${field} 必須是陣列`);
};

const validateManifest = (manifest, manifestPath, packageRoot) => {
  const required = [
    'skill_id',
    'display_name',
    'version',
    'owner',
    'role_id',
    'category',
    'status',
    'entry',
    'rule_language',
    'load_policy',
    'selectors',
    'scopes',
    'dependencies',
    'conflicts',
    'precedence',
    'compatibility',
    'tests'
  ];
  for (const field of required) {
    if (manifest[field] === undefined) fail(`${manifestPath}: 缺少 ${field}`);
  }
  if (manifest.rule_language !== 'zh-TW') {
    fail(`${manifestPath}: rule_language 必須是 zh-TW`);
  }
  for (const selectorType of ['all', 'any', 'none']) {
    assertArray(manifest.selectors?.[selectorType], `selectors.${selectorType}`, manifestPath);
  }
  assertArray(manifest.aliases ?? [], 'aliases', manifestPath);
  assertArray(manifest.dependencies, 'dependencies', manifestPath);
  assertArray(manifest.conflicts, 'conflicts', manifestPath);
  assertArray(manifest.tests, 'tests', manifestPath);

  const expectedRole = toRelative(packageRoot).split('/')[1];
  if (manifest.role_id !== expectedRole) {
    fail(`${manifestPath}: role_id=${manifest.role_id} 與所在角色 ${expectedRole} 不一致`);
  }

  const entryPath = path.resolve(packageRoot, manifest.entry);
  if (!entryPath.startsWith(`${packageRoot}${path.sep}`) || !fs.existsSync(entryPath)) {
    fail(`${manifestPath}: 找不到套件入口 ${manifest.entry}`);
  }
  const rules = fs.readFileSync(entryPath, 'utf8');
  if (!/[\u3400-\u9fff]/u.test(rules)) {
    fail(`${toRelative(entryPath)}: 規則內容必須以中文維護`);
  }

  for (const testPath of manifest.tests) {
    const absoluteTestPath = path.resolve(packageRoot, testPath);
    if (!absoluteTestPath.startsWith(`${packageRoot}${path.sep}`) || !fs.existsSync(absoluteTestPath)) {
      fail(`${manifestPath}: 找不到測試 ${testPath}`);
    }
  }

  return entryPath;
};

const manifestPaths = listFiles(rolesRoot, 'skill.json').sort((left, right) =>
  toRelative(left).localeCompare(toRelative(right))
);
const seenIds = new Set();
const sourcePathSet = new Set();
const documentationFiles = [];
const skills = [];

for (const absoluteManifestPath of manifestPaths) {
  const manifestPath = toRelative(absoluteManifestPath);
  const packageRoot = path.dirname(absoluteManifestPath);
  const manifest = JSON.parse(fs.readFileSync(absoluteManifestPath, 'utf8'));
  const entryPath = validateManifest(manifest, manifestPath, packageRoot);

  if (seenIds.has(manifest.skill_id)) fail(`Skill ID 重複：${manifest.skill_id}`);
  seenIds.add(manifest.skill_id);
  sourcePathSet.add(manifestPath);
  sourcePathSet.add(toRelative(entryPath));

  const readmePath = path.join(packageRoot, 'README.md');
  if (fs.existsSync(readmePath)) {
    documentationFiles.push({
      path: toRelative(readmePath),
      routable: false
    });
  }

  skills.push({
    skill_id: manifest.skill_id,
    manifest_path: manifestPath,
    path: toRelative(entryPath),
    role_id: manifest.role_id,
    category: manifest.category,
    version: manifest.version,
    owner: manifest.owner,
    status: manifest.status,
    load_policy: manifest.load_policy,
    aliases: manifest.aliases ?? [],
    selectors: manifest.selectors,
    scopes: manifest.scopes,
    dependencies: manifest.dependencies,
    conflicts: manifest.conflicts,
    precedence: {
      source: manifestPath,
      rank: manifest.precedence
    },
    compatibility: manifest.compatibility
  });
}

skills.sort((left, right) => left.skill_id.localeCompare(right.skill_id));
documentationFiles.sort((left, right) => left.path.localeCompare(right.path));
const sourcePaths = [...sourcePathSet].sort();
const snapshotFiles = sourcePaths.map((relativePath) => ({
  path: relativePath,
  kind: 'file',
  content_hash: sha256(fs.readFileSync(path.join(workflowRoot, relativePath)))
}));

const registry = {
  $schema: '../schemas/registry.schema.json',
  schema_version: '1.0',
  registry_id: 'skills',
  source: {
    type: 'generated-skill-packages',
    inventory_version: '1.0',
    source_paths: sourcePaths
  },
  source_snapshot: {
    algorithm: 'sha256',
    files: snapshotFiles,
    fingerprint: sha256(Buffer.from(stableJson(snapshotFiles)))
  },
  path_contract:
    '所有路徑皆相對於 AI-Workflow Root；只有 active Skill 可由 Resolver 自動或明確選用。',
  dependency_contract: {
    dependencies: '相依項目只表示納入閉包，不表示載入順序或優先權。',
    load_order: 'Resolver 完成相依閉包後再計算載入順序。',
    precedence: 'precedence 只用於衝突裁決。',
    selectors: 'Role Planner 產生的 facts 必須符合 selectors，才可按條件載入。'
  },
  skills,
  documentation_files: documentationFiles,
  unresolved_references: []
};

const generated = `${JSON.stringify(registry, null, 2)}\n`;
if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== generated) {
    fail('registry/skills.json 與 Skill 套件不同步，請執行 tools/build-skill-registry.mjs');
  }
  console.log(`Skill Registry 檢查成功：${skills.length} 個套件`);
} else {
  fs.writeFileSync(outputPath, generated, 'utf8');
  console.log(`Skill Registry 已產生：${skills.length} 個套件`);
}
