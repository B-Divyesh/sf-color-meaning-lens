import { browser } from 'wxt/browser';
import './style.css';

const app = document.querySelector<HTMLElement>('#app')!;

function renderUnavailable(message: string) {
  app.innerHTML = `<header><span class="kicker">Inspection proof</span><h1>Color Meaning Lens</h1></header><section class="notice"><strong>Lens unavailable here</strong><p>${message}</p></section><button id="options">Open lens settings</button>`;
  app.querySelector('#options')?.addEventListener('click', () => browser.runtime.openOptionsPage());
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('http')) return renderUnavailable('Browser system pages cannot be changed. Open a website and try again.');
  try {
    const state = await browser.tabs.sendMessage(tab.id, { type: 'PING' }) as { enabled: boolean; count: number; host: string };
    app.innerHTML = `<header><span class="kicker">Current sheet</span><h1>Color Meaning Lens</h1><p class="host"></p></header><section class="status"><span class="stamp">${state.enabled ? 'LENS ON' : 'LENS OFF'}</span><p><strong>${state.count} mappings</strong><br><span>Labels are your own notes.</span></p></section><button class="primary" id="toggle">${state.enabled ? 'Remove lens' : 'Apply lens'}</button><button id="pick">Pick a page color</button><button class="link" id="options">Edit all mappings</button><footer><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> toggles the lens</footer>`;
    app.querySelector('.host')!.textContent = state.host;
    app.querySelector('#toggle')?.addEventListener('click', async () => { await browser.tabs.sendMessage(tab.id!, { type: 'TOGGLE_LENS' }); window.close(); });
    app.querySelector('#pick')?.addEventListener('click', async () => { await browser.tabs.sendMessage(tab.id!, { type: 'START_PICK' }); window.close(); });
    app.querySelector('#options')?.addEventListener('click', () => browser.runtime.openOptionsPage());
  } catch {
    renderUnavailable('Reload this tab once after installing the extension, then open the lens again.');
  }
}

void init();
