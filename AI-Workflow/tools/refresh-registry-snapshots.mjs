import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workflowRoot = path.resolve(import.meta.dirname, '..');
const registryRoot = path.join(workflowRoot, 'registry');
const checkOnly = process.argv.includes('--check');

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

const hashDirectory = (absoluteDirectory) => {
  const files = [];
  const walk = (directory) => {
    for (const child of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, child.name);
      if (child.isDirectory()) walk(absolutePath);
      if (child.isFile()) {
        files.push({
          path: path.relative(absoluteDirectory, absolutePath).replaceAll('\\', '/'),
          content_hash: sha256(fs.readFileSync(absolutePath))
        });
      }
    }
  };
  walk(absoluteDirectory);
  files.sort((left, right) => left.path.localeCompare(right.path));
  return sha256(Buffer.from(stableJson(files)));
};

const registryPaths = fs
  .readdirSync(registryRoot)
  .filter((fileName) => fileName.endsWith('.json'))
  .map((fileName) => path.join(registryRoot, fileName))
  .sort();

let changed = 0;
for (const registryPath of registryPaths) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const sourcePaths = [...registry.source.source_paths].sort();
  const files = sourcePaths.map((sourcePath) => {
    const absolutePath = path.join(workflowRoot, sourcePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`${path.basename(registryPath)}: 找不到來源 ${sourcePath}`);
    }
    const kind = fs.statSync(absolutePath).isDirectory() ? 'directory' : 'file';
    return {
      path: sourcePath,
      kind,
      content_hash:
        kind === 'directory'
          ? hashDirectory(absolutePath)
          : sha256(fs.readFileSync(absolutePath))
    };
  });
  const nextSnapshot = {
    algorithm: 'sha256',
    files,
    fingerprint: sha256(Buffer.from(stableJson(files)))
  };
  if (stableJson(registry.source_snapshot) === stableJson(nextSnapshot)) continue;
  changed += 1;
  if (!checkOnly) {
    registry.source_snapshot = nextSnapshot;
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  }
}

if (checkOnly && changed > 0) {
  throw new Error(`${changed} 份 Registry 的來源快照已過期`);
}
console.log(
  checkOnly
    ? `Registry 快照檢查成功：${registryPaths.length} 份`
    : `Registry 快照已更新：${changed} 份`
);
