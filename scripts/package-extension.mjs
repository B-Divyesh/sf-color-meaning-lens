import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import archiver from 'archiver';

const source = resolve('dist/extension/chrome-mv3');
const targetDir = resolve('dist/site/downloads');
const target = resolve(targetDir, 'color-meaning-lens-chrome.zip');
await mkdir(targetDir, { recursive: true });

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(target);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolvePromise);
  output.on('error', reject);
  archive.on('warning', (error) => error.code === 'ENOENT' ? undefined : reject(error));
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(source, false);
  void archive.finalize();
});

console.log(`Packaged ${target}`);
