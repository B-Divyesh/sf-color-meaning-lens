import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.COLOR_MEANING_LENS_URL ?? 'https://color-meaning-lens.sociobot.in';
const browser = await chromium.launch({ headless: true });
const findings = [];

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktop.newPage();
  const requests = new Set();
  const consoleErrors = [];
  page.on('request', (request) => requests.add(new URL(request.url()).origin));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  for (const path of ['/', '/privacy/', '/terms/']) {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    const structure = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length }));
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
    findings.push({ path, ...structure, serious: serious.map((item) => item.id) });
    if (!structure.title || structure.lang !== 'en' || structure.h1 !== 1 || structure.main !== 1 || structure.missingAlt || serious.length) throw new Error(`Live structure or accessibility check failed for ${path}.`);
  }
  if (consoleErrors.length) throw new Error(`Live console errors: ${consoleErrors.join('; ')}`);
  if ([...requests].some((requestOrigin) => requestOrigin !== origin)) throw new Error(`Unexpected normal-load outbound request: ${[...requests].join(', ')}`);

  const home = await desktop.request.get(`${origin}/`);
  const assetPath = (await home.text()).match(/\/assets\/[^"']+\.js/)?.[0];
  if (!assetPath) throw new Error('Live page does not reference a hashed JavaScript asset.');
  const asset = await desktop.request.get(`${origin}${assetPath}`);
  const worker = await desktop.request.get(`${origin}/sw.js`);
  const manifest = await desktop.request.get(`${origin}/site.webmanifest.json`);
  const zip = await desktop.request.get(`${origin}/downloads/color-meaning-lens-chrome.zip`);
  const zipBody = await zip.body();
  const localZip = await readFile('dist/site/downloads/color-meaning-lens-chrome.zip');
  const liveHash = createHash('sha256').update(zipBody).digest('hex');
  const localHash = createHash('sha256').update(localZip).digest('hex');
  if (!home.ok() || !home.headers()['content-security-policy'] || !home.headers()['permissions-policy'] || home.headers()['x-frame-options'] !== 'DENY') throw new Error('Live security headers are incomplete.');
  if (asset.headers()['cache-control'] !== 'public, max-age=31536000, immutable') throw new Error(`Live asset cache policy is incorrect: ${asset.headers()['cache-control']}`);
  if (worker.headers()['cache-control'] !== 'no-cache' || !/color-meaning-lens-[a-f0-9]{16}/.test(await worker.text())) throw new Error('Live service worker is not versioned and revalidated.');
  if (!manifest.headers()['content-type']?.startsWith('application/json')) throw new Error(`Live manifest media type is incorrect: ${manifest.headers()['content-type']}`);
  if (!zip.ok() || !zip.headers()['content-type']?.startsWith('application/zip') || zip.headers()['content-disposition'] !== 'attachment' || zipBody.subarray(0, 4).toString() !== 'PK\u0003\u0004' || liveHash !== localHash) throw new Error(`Live ZIP is not the built extension package: ${zip.status()} ${zip.headers()['content-type']} ${liveHash}`);

  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) throw new Error('Live service worker did not take control.');
  await page.close();
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${origin}/`, { waitUntil: 'networkidle' });
  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await mobilePage.locator('#demo-toggle').focus();
  await mobilePage.locator('#demo-toggle').press('Space');
  const demoState = await mobilePage.locator('#demo-toggle').getAttribute('aria-pressed');
  const reducedMotion = await mobilePage.locator('.button.primary').first().evaluate((button) => ({ transition: getComputedStyle(button).transitionDuration, scroll: getComputedStyle(document.documentElement).scrollBehavior, outline: getComputedStyle(document.querySelector('#demo-toggle')).outlineWidth }));
  if (overflow > 1 || demoState !== 'true' || reducedMotion.transition !== '0s' || reducedMotion.scroll !== 'auto' || reducedMotion.outline !== '3px') throw new Error(`Live mobile/keyboard/reduced-motion check failed: ${JSON.stringify({ overflow, demoState, reducedMotion })}`);
  await mobilePage.close();
  await mobile.close();

  console.log(JSON.stringify({ origin, pages: findings, privacyOrigins: [...requests], zip: { bytes: zipBody.length, sha256: liveHash }, responsePolicy: true, serviceWorker: true, mobile: { overflow, keyboard: true, reducedMotion } }, null, 2));
} finally {
  await browser.close();
}
