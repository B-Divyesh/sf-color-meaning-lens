import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const extensionPath = resolve('dist/extension/chrome-mv3');
const profile = await mkdtemp(join(tmpdir(), 'color-meaning-lens-'));
const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><html lang="en"><title>Lens test bench</title><body><main><h1>Build status</h1><button style="background:#16a34a;color:#fff;padding:20px">Passing job</button></main></body></html>');
});
await new Promise((resolvePromise) => server.listen(4180, '127.0.0.1', resolvePromise));

const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});
try {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4180/', { waitUntil: 'networkidle' });
  await page.locator('#color-meaning-lens-root').waitFor({ state: 'attached' });
  await page.waitForFunction(() => Number(document.querySelector('#color-meaning-lens-root')?.getAttribute('data-mark-count')) > 0);
  const marked = await page.locator('#color-meaning-lens-root').getAttribute('data-mark-count');
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((candidate) => candidate.url?.includes('127.0.0.1:4180'));
    if (!tab?.id) throw new Error('Test tab not found');
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_LENS' });
  });
  await page.waitForFunction(() => document.querySelector('#color-meaning-lens-root')?.getAttribute('data-mark-count') === '0');
  const extensionId = new URL(worker.url()).host;
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.locator('h1').waitFor();
  const optionsState = { h1: await options.locator('h1').count(), starterMappings: await options.locator('.mapping').count() };
  if (optionsState.h1 !== 1 || optionsState.starterMappings !== 3) throw new Error(`Options smoke test failed: ${JSON.stringify(optionsState)}`);
  if (errors.length) throw new Error(`Extension console errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ contentScriptLoaded: true, starterMappingRendered: Number(marked), toggleRemovedMarks: true, optionsState, consoleErrors: errors }, null, 2));
} finally {
  await context.close();
  server.close();
  await rm(profile, { recursive: true, force: true });
}
