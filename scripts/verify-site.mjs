import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = join(process.cwd(), 'dist/site');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.avif': 'image/avif', '.zip': 'application/zip', '.json': 'application/json' };
const deployment = JSON.parse(await readFile(join(root, 'staticwebapp.config.json'), 'utf8'));
const excludedFallbacks = deployment.navigationFallback?.exclude ?? [];
const globalHeaders = Object.fromEntries(Object.entries(deployment.globalHeaders ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
let serviceWorkerVariant = 'upgrade-a';

function deploymentHeaders(path) {
  const headers = { ...globalHeaders };
  if (path.startsWith('/assets/')) headers['cache-control'] = 'public, max-age=31536000, immutable';
  if (path.startsWith('/downloads/') && path.endsWith('.zip')) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
    headers['content-disposition'] = 'attachment';
  }
  if (path === '/sw.js') headers['cache-control'] = 'no-cache';
  if (path === '/site.webmanifest') {
    headers['content-type'] = 'application/manifest+json; charset=utf-8';
    headers['cache-control'] = 'public, max-age=86400';
  }
  return headers;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const requestPath = url.pathname;
    let path = normalize(decodeURIComponent(requestPath)).replace(/^[/\\]+/, '');
    if (!path || path.endsWith('/')) path += 'index.html';
    const target = join(root, path);
    if (!(await stat(target)).isFile() || !target.startsWith(root)) {
      const isNavigation = request.headers.accept?.includes('text/html');
      const excluded = requestPath.startsWith('/assets/') || requestPath.startsWith('/downloads/') || /\.[a-z0-9]+$/i.test(requestPath);
      if (!isNavigation || excluded) throw new Error('Not found');
      path = 'index.html';
    }
    let body = await readFile(join(root, path));
    if (requestPath === '/sw.js') body = Buffer.from(body.toString().replace(/color-meaning-lens-[a-f0-9]{16}/, `color-meaning-lens-${serviceWorkerVariant}`));
    response.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream', ...deploymentHeaders(requestPath) });
    response.end(body);
  } catch { response.writeHead(404, deploymentHeaders(new URL(request.url ?? '/', 'http://127.0.0.1').pathname)); response.end('Not found'); }
});
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const findings = [];
try {
  if (!excludedFallbacks.includes('/downloads/*') || !excludedFallbacks.some((rule) => rule.includes('zip'))) throw new Error('Deployment config must exclude downloadable ZIP files from navigation fallback.');
  if (!deployment.globalHeaders?.['Content-Security-Policy'] || !deployment.globalHeaders?.['Permissions-Policy']) throw new Error('Deployment config is missing the required CSP or Permissions-Policy.');
  const generatedWorker = await readFile(join(root, 'sw.js'), 'utf8');
  if (!/color-meaning-lens-[a-f0-9]{16}/.test(generatedWorker) || !generatedWorker.includes('/assets/')) throw new Error('Service worker is not build-versioned with the hashed application assets precached.');

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
  await mobile.locator('#demo-toggle').press('Space');
  if (await mobile.locator('#demo-toggle').getAttribute('aria-pressed') !== 'false') throw new Error('Demo toggle did not respond to the Space key.');
  const focusOutline = await mobile.locator('#demo-toggle').evaluate((button) => getComputedStyle(button).outlineWidth);
  if (focusOutline !== '3px') throw new Error(`Demo toggle focus ring is not 3px (received ${focusOutline}).`);
  await mobile.screenshot({ path: '.factory/mobile-proof.png', fullPage: true });
  await mobile.close();
  await mobileContext.close();

  const reducedMotionContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedMotion = await reducedMotionContext.newPage();
  await reducedMotion.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  const motion = await reducedMotion.locator('.button.primary').first().evaluate((button) => ({ transition: getComputedStyle(button).transitionDuration, scroll: getComputedStyle(document.documentElement).scrollBehavior }));
  await reducedMotion.close();
  await reducedMotionContext.close();
  if (motion.transition !== '0s' || motion.scroll !== 'auto') throw new Error(`Reduced-motion policy failed: ${JSON.stringify(motion)}`);

  const zip = await desktopContext.request.get('http://127.0.0.1:4173/downloads/color-meaning-lens-chrome.zip');
  const zipBody = await zip.body();
  if (!zip.ok() || !zip.headers()['content-type']?.startsWith('application/zip') || zip.headers()['content-disposition'] !== 'attachment' || zipBody.subarray(0, 4).toString() !== 'PK\u0003\u0004') throw new Error(`Download regression: expected a ZIP response, received ${zip.status()} ${zip.headers()['content-type']}`);
  const missingZip = await desktopContext.request.get('http://127.0.0.1:4173/downloads/missing.zip', { headers: { accept: 'text/html' } });
  if (missingZip.status() !== 404) throw new Error('Missing ZIP was rewritten to the app shell instead of returning 404.');
  const asset = await desktopContext.request.get(`http://127.0.0.1:4173${(await readFile(join(root, 'index.html'), 'utf8')).match(/\/assets\/[^"']+\.js/)?.[0]}`);
  if (asset.headers()['cache-control'] !== 'public, max-age=31536000, immutable') throw new Error('Hashed asset cache policy is not immutable.');
  const manifest = await desktopContext.request.get('http://127.0.0.1:4173/site.webmanifest');
  if (!manifest.headers()['content-type']?.startsWith('application/manifest+json')) throw new Error('Web manifest media type is not configured.');
  const home = await desktopContext.request.get('http://127.0.0.1:4173/');
  if (!home.headers()['content-security-policy'] || !home.headers()['permissions-policy'] || home.headers()['x-frame-options'] !== 'DENY') throw new Error('Response security policy is incomplete.');

  const pwaContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pwa = await pwaContext.newPage();
  await pwa.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await pwa.evaluate(() => navigator.serviceWorker.ready);
  await pwa.reload({ waitUntil: 'networkidle' });
  const initialController = await pwa.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? '');
  if (!initialController) throw new Error('Service worker did not control the page after registration.');
  serviceWorkerVariant = 'upgrade-b';
  const updated = await pwa.evaluate(async () => new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 8_000);
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(true); }, { once: true });
    void navigator.serviceWorker.getRegistration().then((registration) => registration?.update());
  }));
  if (!updated) throw new Error('A changed service worker did not take control after registration.update().');
  await pwaContext.setOffline(true);
  await pwa.reload({ waitUntil: 'domcontentloaded' });
  const offlineStructure = await pwa.evaluate(() => ({ title: document.title, main: document.querySelectorAll('main').length }));
  await pwaContext.setOffline(false);
  if (!offlineStructure.title || offlineStructure.main !== 1) throw new Error('Offline reload did not return the cached application shell.');
  await pwa.close();
  await pwaContext.close();

  console.log(JSON.stringify({ pages: findings, mobileOverflow: overflow, keyboard: true, reducedMotion: motion, package: { contentType: zip.headers()['content-type'], bytes: zipBody.length, missingZip: missingZip.status() }, responsePolicy: true, pwaUpdateAndOffline: true }, null, 2));
} finally {
  await browser.close();
  server.close();
}
