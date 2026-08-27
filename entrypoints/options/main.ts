import { browser } from 'wxt/browser';
import { normalizeHex } from '../../shared/color';
import { CHECKOUT_URL, cachedLicense, saveLicenseToken, verifyLicense } from '../../shared/license';
import { getConfig, lensFor, saveConfig } from '../../shared/storage';
import { newMapping, type LensConfig, type Pattern, type SiteLens } from '../../shared/types';
import './style.css';
import './links.css';
import './links.css';

const app = document.querySelector<HTMLElement>('#app')!;
let config: LensConfig;
let host = '';
let lens: SiteLens;

function escapeHtml(value: string) { const span = document.createElement('span'); span.textContent = value; return span.innerHTML; }
function mappingRow(mapping: SiteLens['mappings'][number], index: number) {
  return `<article class="mapping" data-index="${index}"><div class="swatch" style="background:${mapping.color}" title="${mapping.color}"></div><label>Color<input class="color" value="${mapping.color}" inputmode="text" aria-label="Mapping color"></label><label>Label<input class="label" value="${escapeHtml(mapping.label)}" maxlength="16" aria-label="Short label"></label><label>Pattern<select class="pattern" aria-label="Pattern"><option value="dots" ${mapping.pattern === 'dots' ? 'selected' : ''}>Dots · ${mapping.symbol}</option><option value="stripes" ${mapping.pattern === 'stripes' ? 'selected' : ''}>Stripes · ${mapping.symbol}</option><option value="crosshatch" ${mapping.pattern === 'crosshatch' ? 'selected' : ''}>Crosshatch · ${mapping.symbol}</option><option value="solid" ${mapping.pattern === 'solid' ? 'selected' : ''}>Soft solid · ${mapping.symbol}</option></select></label><button class="danger remove" type="button" aria-label="Remove ${escapeHtml(mapping.label)} mapping">Remove</button></article>`;
}

async function activeHost() {
  try { const [tab] = await browser.tabs.query({ active: true, currentWindow: true }); return tab?.url?.startsWith('http') ? new URL(tab.url).hostname : ''; }
  catch { return ''; }
}

function render() {
  const hosts = [...new Set([host, ...Object.keys(config.sites)])].filter(Boolean).sort();
  app.innerHTML = `<span class="eyebrow">Pattern register / v1</span><h1>Make this site readable without its colors.</h1><p class="intro">Map the colors you know to short labels and textures. The lens only applies your notes; it does not guess what a color means.</p><section class="toolbar" aria-label="Site controls"><label class="field">Website<input id="host" value="${escapeHtml(host)}" placeholder="dashboard.example.com" spellcheck="false"><small>Hostname only; mappings stay on this device.</small></label><label class="field">Lens for this site<select id="site-enabled"><option value="on" ${lens.enabled ? 'selected' : ''}>On</option><option value="off" ${!lens.enabled ? 'selected' : ''}>Off</option></select></label><button class="primary" id="load" type="button">Open site docket</button>${hosts.length ? `<label class="field">Saved sites<select id="saved-sites"><option value="">Choose…</option>${hosts.map((name) => `<option>${escapeHtml(name)}</option>`).join('')}</select></label>` : ''}</section><section aria-labelledby="mapping-title"><h2 id="mapping-title">Color mappings</h2><p class="quiet">Tolerance is tuned to catch nearby interface shades. Use the popup picker for exact page colors.</p><div class="mapping-list">${lens.mappings.length ? lens.mappings.map(mappingRow).join('') : '<div class="empty"><strong>No mappings yet.</strong><p>Add one here or use “Pick a page color” from the extension popup.</p></div>'}</div><div class="actions"><button class="primary" id="add" type="button">Add mapping</button><button id="reset" type="button">Restore starter mappings</button></div><p class="message" id="message" role="status" aria-live="polite"></p></section>${supporterMarkup()}`;
  bind();
}

function supporterMarkup() {
  const valid = cachedLicense()?.verdict?.valid;
  const presets = JSON.parse(localStorage.getItem('cml:supporter-presets') ?? '[]') as { name: string; host: string; lens: SiteLens }[];
  const content = valid
    ? `<p><strong>Supporter unlocked.</strong> Save named copies of site setups for quick reuse. Core lens features and export remain free.</p><div class="actions"><button id="save-preset" type="button">Save current setup</button></div><div>${presets.map((preset, index) => `<div class="preset"><span><strong>${escapeHtml(preset.name)}</strong><br><small>${escapeHtml(preset.host)}</small></span><button type="button" data-preset="${index}">Apply</button></div>`).join('')}</div>`
    : `<p>The complete accessibility tool is free. A supporter license adds named local presets and funds maintenance—no subscription, account, or hosted color data.</p><div class="actions"><a class="primary-link" href="${CHECKOUT_URL}" target="_blank" rel="noreferrer">Buy supporter license — $12</a></div><form id="license-form"><label class="field">Have a license?<input id="license" autocomplete="off" required placeholder="Paste license token"></label><button type="submit">Verify and restore</button></form>`;
  return `<section class="supporter" aria-labelledby="support-title"><span class="eyebrow">Optional one-time purchase · $12</span><h2 id="support-title">Support the lens</h2>${content}<p class="message" id="license-message" role="status" aria-live="polite"></p></section>`;
}

function readRows() {
  document.querySelectorAll<HTMLElement>('.mapping').forEach((row) => {
    const index = Number(row.dataset.index); const mapping = lens.mappings[index]; if (!mapping) return;
    const color = normalizeHex(row.querySelector<HTMLInputElement>('.color')!.value); if (color) mapping.color = color;
    mapping.label = row.querySelector<HTMLInputElement>('.label')!.value.trim().toUpperCase() || 'NOTE';
    mapping.pattern = row.querySelector<HTMLSelectElement>('.pattern')!.value as Pattern;
  });
}

async function persist(message = 'Saved locally.') {
  readRows(); lens.enabled = document.querySelector<HTMLSelectElement>('#site-enabled')?.value !== 'off'; config.sites[host] = lens; await saveConfig(config);
  const target = document.querySelector('#message'); if (target) target.textContent = message;
}

function bind() {
  document.querySelector('#load')?.addEventListener('click', async () => { const value = (document.querySelector<HTMLInputElement>('#host')!.value).trim().replace(/^https?:\/\//, '').split('/')[0]; if (!value) return; await persist(); host = value; lens = lensFor(config, host); render(); });
  document.querySelector('#saved-sites')?.addEventListener('change', (event) => { const value = (event.target as HTMLSelectElement).value; if (value) { host = value; lens = lensFor(config, host); render(); } });
  document.querySelector('#site-enabled')?.addEventListener('change', () => void persist());
  document.querySelector('#add')?.addEventListener('click', () => { readRows(); lens.mappings.push(newMapping()); render(); document.querySelectorAll<HTMLInputElement>('.color')[lens.mappings.length - 1]?.focus(); });
  document.querySelector('#reset')?.addEventListener('click', () => { delete config.sites[host]; lens = lensFor(config, host); render(); void persist('Starter PASS, WARN, and FAIL mappings restored.'); });
  document.querySelectorAll('.mapping input,.mapping select').forEach((control) => control.addEventListener('change', () => void persist()));
  document.querySelectorAll<HTMLButtonElement>('.remove').forEach((control) => control.addEventListener('click', () => { readRows(); lens.mappings.splice(Number(control.closest<HTMLElement>('.mapping')!.dataset.index), 1); render(); void persist('Mapping removed.'); }));
  document.querySelector('#license-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const token = document.querySelector<HTMLInputElement>('#license')!.value.trim(); const message = document.querySelector<HTMLElement>('#license-message')!; saveLicenseToken(token); message.textContent = 'Checking license…'; try { const verdict = await verifyLicense(token, localStorage, true); if (verdict.valid) render(); else message.textContent = `License is not active (${verdict.reason}). Free features remain available.`; } catch { message.textContent = 'Could not reach the license service. Free features still work; try again when online.'; } });
  document.querySelector('#save-preset')?.addEventListener('click', () => { const name = prompt('Name this setup'); if (!name) return; const presets = JSON.parse(localStorage.getItem('cml:supporter-presets') ?? '[]'); presets.push({ name: name.slice(0, 32), host, lens: structuredClone(lens) }); localStorage.setItem('cml:supporter-presets', JSON.stringify(presets.slice(-20))); render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((control) => control.addEventListener('click', () => { const presets = JSON.parse(localStorage.getItem('cml:supporter-presets') ?? '[]'); const preset = presets[Number(control.dataset.preset)]; if (!preset) return; lens = structuredClone(preset.lens); render(); void persist(`Applied “${preset.name}”.`); }));
}

async function init() {
  config = await getConfig(); host = await activeHost() || Object.keys(config.sites)[0] || 'example.com'; lens = lensFor(config, host); render();
  const saved = cachedLicense(); if (saved?.token) verifyLicense(saved.token).then((verdict) => { if (verdict.valid !== saved.verdict?.valid) render(); }).catch(() => undefined);
}

void init();
