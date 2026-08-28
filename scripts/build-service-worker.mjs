import { createHash } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const siteRoot = resolve('dist/site');
const template = await readFile(resolve('site/sw-template.js'), 'utf8');
const pages = ['index.html', 'privacy/index.html', 'terms/index.html'];
const referenced = new Set(['/', '/privacy/', '/terms/', '/site.webmanifest.json', '/favicon.svg']);
const fileForUrl = (url) => resolve(siteRoot, url === '/' ? 'index.html' : `${url.slice(1)}${url.endsWith('/') ? 'index.html' : ''}`);

for (const page of pages) {
  const html = await readFile(resolve(siteRoot, page), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) referenced.add(match[1]);
}

const precache = [...referenced].sort();
for (const url of precache) await access(fileForUrl(url));
const digest = createHash('sha256');
for (const url of precache) {
  digest.update(url);
  digest.update(await readFile(fileForUrl(url)));
}
const cacheName = `color-meaning-lens-${digest.digest('hex').slice(0, 16)}`;
const serviceWorker = template
  .replace('__CACHE_NAME__', cacheName)
  .replace('__PRECACHE__', JSON.stringify(precache));

await writeFile(resolve(siteRoot, 'sw.js'), serviceWorker);
console.log(`Generated versioned service worker: ${cacheName}`);
