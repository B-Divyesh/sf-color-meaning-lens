import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import archiver from 'archiver';

const source = resolve('dist/extension/chrome-mv3');
const targetDir = resolve('dist/site/downloads');
const target = resolve(targetDir, 'color-meaning-lens-chrome.zip');
// ZIP timestamps are part of an archive's bytes. Pinning them makes a clean
// build a reliable identity for the downloadable extension, rather than an
// accidental record of when WXT happened to write each file.
const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((first, second) => first.name.localeCompare(second.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

await mkdir(targetDir, { recursive: true });
const files = await filesIn(source);
const entries = await Promise.all(files.map(async (file) => ({
  data: await readFile(file),
  name: relative(source, file).replaceAll('\\', '/')
})));

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(target);
  const archive = archiver('zip', { forceLocalTime: false, zlib: { level: 9 } });
  output.on('close', resolvePromise);
  output.on('error', reject);
  archive.on('warning', (error) => error.code === 'ENOENT' ? undefined : reject(error));
  archive.on('error', reject);
  archive.pipe(output);
  for (const entry of entries) {
    archive.append(entry.data, {
      name: entry.name,
      date: ZIP_EPOCH,
      mode: 0o100644
    });
  }
  void archive.finalize();
});

console.log(`Packaged ${target}`);
