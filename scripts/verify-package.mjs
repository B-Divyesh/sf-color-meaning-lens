import { createHash } from 'node:crypto';
import { readFile, stat, utimes } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const archivePath = resolve('dist/site/downloads/color-meaning-lens-chrome.zip');
const sourceFile = resolve('dist/extension/chrome-mv3/manifest.json');

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function packageExtension() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['scripts/package-extension.mjs'], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolvePromise(undefined) : reject(new Error(`Packaging exited with ${code}.`)));
  });
}

const before = await stat(sourceFile);
try {
  await packageExtension();
  const first = hash(await readFile(archivePath));
  // Changing only an input file's mtime reproduced the historic defect. A
  // reproducible package must ignore it while retaining the same contents.
  const changed = new Date(Math.max(Date.now(), before.mtimeMs + 2_000));
  await utimes(sourceFile, changed, changed);
  await packageExtension();
  const second = hash(await readFile(archivePath));
  if (first !== second) throw new Error(`Package bytes changed when only source metadata changed: ${first} != ${second}`);
  console.log(JSON.stringify({ deterministicZip: true, sha256: first }, null, 2));
} finally {
  await utimes(sourceFile, before.atime, before.mtime);
}
