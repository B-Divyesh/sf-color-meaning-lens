import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = join(process.cwd(), 'dist/site');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.avif': 'image/avif', '.zip': 'application/zip', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    let path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname)).replace(/^[/\\]+/, '');
    if (!path || path.endsWith('/')) path += 'index.html';
    const target = join(root, path);
    if (!(await stat(target)).isFile() || !target.startsWith(root)) throw new Error('Not found');
    response.writeHead(200, { 'content-type': mime[extname(target)] ?? 'application/octet-stream' });
    response.end(await readFile(target));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const findings = [];
try {
  for (const path of ['/', '/privacy/', '/terms/']) {
    const page = await desktopContext.newPage();
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(`http://127.0.0.1:4173${path}`, { waitUntil: 'networkidle' });
    const structure = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length }));
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
    findings.push({ path, structure, consoleErrors, serious: serious.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })) });
    if (!structure.title || structure.lang !== 'en' || structure.h1 !== 1 || structure.main !== 1 || structure.missingAlt || consoleErrors.length || serious.length) throw new Error(`Verification failed for ${path}: ${JSON.stringify(findings.at(-1))}`);
    await page.close();
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mobile = await mobileContext.newPage();
  await mobile.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Mobile layout overflows by ${overflow}px`);
  await mobile.locator('#demo-toggle').click();
  if (await mobile.locator('#demo-toggle').getAttribute('aria-pressed') !== 'true') throw new Error('Demo toggle did not activate.');
  await mobile.screenshot({ path: '.factory/mobile-proof.png', fullPage: true });
  await mobile.close();
  await mobileContext.close();
  console.log(JSON.stringify({ pages: findings, mobileOverflow: overflow }, null, 2));
} finally {
  await browser.close();
  server.close();
}
