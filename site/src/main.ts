import '../../shared/license';
import { LICENSE_KEY, VERDICT_KEY, cachedLicense, captureLicenseFromUrl, saveLicenseToken, verifyLicense } from '../../shared/license';
import './styles.css';

const demoButton = document.querySelector<HTMLButtonElement>('#demo-toggle');
const grid = document.querySelector<HTMLElement>('#status-grid');
const demoNote = document.querySelector<HTMLElement>('#demo-note');

demoButton?.addEventListener('click', () => {
  const active = demoButton.getAttribute('aria-pressed') !== 'true';
  demoButton.setAttribute('aria-pressed', String(active));
  demoButton.textContent = active ? 'Remove demo lens' : 'Apply demo lens';
  grid?.classList.toggle('lens-on', active);
  if (demoNote) demoNote.textContent = active ? 'Lens is on. Every tile now has a pattern, symbol, and label.' : 'Lens is off. The tiles depend on color.';
});

const form = document.querySelector<HTMLFormElement>('#restore-form');
const input = document.querySelector<HTMLInputElement>('#license-token');
const status = document.querySelector<HTMLElement>('#license-status');

async function check(token: string, force = false) {
  if (status) status.textContent = 'Checking your license…';
  try {
    const verdict = await verifyLicense(token, localStorage, force);
    if (status) status.textContent = verdict.valid ? 'Supporter license active. Paste this token in the extension settings to unlock named setups there.' : `License no longer active (${verdict.reason}). The free extension still works.`;
    document.body.classList.toggle('supporter-active', verdict.valid);
  } catch {
    const cached = cachedLicense();
    if (status) status.textContent = cached?.verdict?.valid ? 'Offline. Your last valid supporter check remains active.' : 'Could not reach the license service. Try again when online; the free extension still works.';
  }
}

form?.addEventListener('submit', (event) => { event.preventDefault(); const token = input?.value.trim(); if (!token) return; saveLicenseToken(token); void check(token, true); });

const incoming = captureLicenseFromUrl();
const existing = cachedLicense();
if (incoming) void check(incoming, true); else if (existing?.token) void check(existing.token);

if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));

export { LICENSE_KEY, VERDICT_KEY };
