import { browser } from 'wxt/browser';
import { bestMatch, cssColorToHex } from '../shared/color';
import { getConfig, lensFor, updateSite } from '../shared/storage';
import { newMapping, STORAGE_KEY, type ColorMapping, type LensConfig, type SiteLens } from '../shared/types';

declare global {
  interface Window { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }
}

const HOST_ID = 'color-meaning-lens-root';
const MAX_SCAN = 1800;

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    const hostName = location.hostname;
    let config: LensConfig;
    let lens: SiteLens;
    let sessionEnabled = true;
    let renderQueued = false;
    let picking = false;
    let hovered: Element | null = null;
    let observer: MutationObserver | null = null;

    const host = document.createElement('div');
    host.id = HOST_ID;
    const root = host.attachShadow({ mode: 'closed' });
    const overlays = document.createElement('div');
    const ui = document.createElement('div');
    root.append(styleElement(), overlays, ui);
    document.documentElement.append(host);

    function styleElement() {
      const style = document.createElement('style');
      style.textContent = `
        :host{all:initial;position:fixed;inset:0;z-index:2147483646;pointer-events:none;font-family:Inter,Aptos,Segoe UI,sans-serif}
        .mark{position:fixed;box-sizing:border-box;border:2px solid #111820;pointer-events:none;animation:cml-in .16s ease-out both}
        .mark::before{content:"";position:absolute;inset:0;opacity:.28}
        .dots::before{background:radial-gradient(circle,#111820 1.4px,transparent 1.6px) 0 0/7px 7px}
        .stripes::before{background:repeating-linear-gradient(135deg,#111820 0 2px,transparent 2px 8px)}
        .crosshatch::before{background:repeating-linear-gradient(45deg,#111820 0 1px,transparent 1px 8px),repeating-linear-gradient(135deg,#111820 0 1px,transparent 1px 8px)}
        .solid::before{background:#111820;opacity:.12}
        .tag{position:absolute;top:-2px;left:-2px;max-width:220px;padding:3px 6px;background:#111820;color:#fffdf7;font:bold 12px/1.25 Arial Narrow,Arial,sans-serif;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dock{position:fixed;right:16px;bottom:16px;width:min(344px,calc(100vw - 32px));box-sizing:border-box;padding:16px;background:#fffdf7;color:#171a1f;border:2px solid #171a1f;box-shadow:5px 5px 0 #164b78;pointer-events:auto;font:16px/1.4 Inter,Aptos,Segoe UI,sans-serif}
        .dock *{box-sizing:border-box}.dock h2{font:800 20px/1.1 Arial Narrow,Arial,sans-serif;margin:0 0 8px;text-transform:uppercase}.dock p{margin:0 0 12px}.dock small{display:block;color:#55584f;margin-top:8px}
        .actions{display:flex;flex-wrap:wrap;gap:8px}.dock button,.dock input,.dock select{min-height:44px;font:inherit;border:2px solid #171a1f;background:#fffdf7;color:#171a1f}.dock button{padding:8px 12px;font-weight:750;cursor:pointer}.dock button.primary{background:#164b78;color:#fff;border-color:#164b78}.dock button:focus-visible,.dock input:focus-visible,.dock select:focus-visible{outline:3px solid #f28c45;outline-offset:2px}
        .dock label{display:grid;gap:4px;margin:10px 0;font-weight:700}.dock input,.dock select{width:100%;padding:8px}.picker-box{position:fixed;border:3px dashed #164b78;background:rgba(22,75,120,.12);pointer-events:none}
        @keyframes cml-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
        @media(prefers-reduced-motion:reduce){.mark{animation:none}}
      `;
      return style;
    }

    function visible(element: Element, rect: DOMRect) {
      const tag = element.tagName;
      return rect.width >= 8 && rect.height >= 8 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= innerHeight && rect.left <= innerWidth && !['HTML', 'BODY', 'SCRIPT', 'STYLE'].includes(tag);
    }

    function colorsFor(element: Element) {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color, style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor]
        .map(cssColorToHex).filter((color): color is string => Boolean(color));
    }

    function scheduleRender() {
      if (renderQueued) return;
      renderQueued = true;
      requestAnimationFrame(() => { renderQueued = false; render(); });
    }

    function render() {
      overlays.replaceChildren();
      host.dataset.markCount = '0';
      if (!config?.globalEnabled || !lens?.enabled || !sessionEnabled) return;
      const fragment = document.createDocumentFragment();
      const elements = [...document.body.querySelectorAll('*')].slice(0, MAX_SCAN);
      let marked = 0;
      for (const element of elements) {
        if (element === host || host.contains(element) || element === document.activeElement || marked >= 120) continue;
        const rect = element.getBoundingClientRect();
        if (!visible(element, rect)) continue;
        const index = bestMatch(colorsFor(element), lens.mappings);
        if (index < 0) continue;
        const mapping = lens.mappings[index];
        if (!mapping) continue;
        const mark = document.createElement('div');
        mark.className = `mark ${mapping.pattern}`;
        mark.setAttribute('aria-hidden', 'true');
        mark.style.cssText = `left:${Math.max(0, rect.left)}px;top:${Math.max(0, rect.top)}px;width:${Math.min(rect.width, innerWidth - Math.max(0, rect.left))}px;height:${Math.min(rect.height, innerHeight - Math.max(0, rect.top))}px`;
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = `${mapping.symbol} ${mapping.label}`;
        tag.title = `Lens note: ${mapping.label}. This label is from your mapping.`;
        mark.append(tag);
        fragment.append(mark);
        marked++;
      }
      overlays.append(fragment);
      host.dataset.markCount = String(marked);
    }

    function closeDock() {
      picking = false;
      hovered = null;
      ui.replaceChildren();
      removeEventListener('pointermove', highlightTarget, true);
      removeEventListener('click', chooseTarget, true);
      removeEventListener('keydown', onEscape, true);
    }

    function button(label: string, handler: () => void | Promise<void>, primary = false) {
      const control = document.createElement('button');
      control.type = 'button'; control.textContent = label;
      if (primary) control.className = 'primary';
      control.addEventListener('click', () => void handler());
      return control;
    }

    function openPicker() {
      closeDock();
      const dock = document.createElement('section'); dock.className = 'dock'; dock.setAttribute('role', 'dialog'); dock.setAttribute('aria-label', 'Pick a page color');
      dock.innerHTML = '<h2>Add a lens note</h2><p>Sample one visible color, then tell the lens what it means on this site.</p>';
      const actions = document.createElement('div'); actions.className = 'actions';
      if (window.EyeDropper) actions.append(button('Open eyedropper', async () => {
        try { const result = await new window.EyeDropper!().open(); showEditor(result.sRGBHex); }
        catch { showMessage('No color was selected. You can try again or close this panel.'); }
      }, true));
      actions.append(button('Pick a page element', startElementPick, !window.EyeDropper), button('Close', closeDock));
      dock.append(actions);
      const note = document.createElement('small'); note.textContent = 'Nothing is uploaded. Escape cancels element picking.'; dock.append(note);
      ui.append(dock);
      (dock.querySelector('button') as HTMLButtonElement).focus();
      addEventListener('keydown', onEscape, true);
    }

    function showMessage(message: string) {
      const paragraph = ui.querySelector('.dock p'); if (paragraph) paragraph.textContent = message;
    }

    function startElementPick() {
      picking = true; ui.replaceChildren();
      const dock = document.createElement('div'); dock.className = 'dock'; dock.innerHTML = '<h2>Point, then click</h2><p>Choose the colored status, chart mark, or diff block. Press Escape to cancel.</p>'; ui.append(dock);
      addEventListener('pointermove', highlightTarget, true);
      addEventListener('click', chooseTarget, true);
      addEventListener('keydown', onEscape, true);
    }

    function highlightTarget(event: PointerEvent) {
      const target = event.composedPath()[0]; if (!(target instanceof Element) || target === host) return;
      hovered = target; const rect = target.getBoundingClientRect();
      let box = ui.querySelector('.picker-box') as HTMLElement | null;
      if (!box) { box = document.createElement('div'); box.className = 'picker-box'; ui.append(box); }
      box.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
    }

    function chooseTarget(event: MouseEvent) {
      if (!picking || !hovered) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const style = getComputedStyle(hovered);
      const chosen = cssColorToHex(style.backgroundColor) ?? cssColorToHex(style.borderTopColor) ?? cssColorToHex(style.color);
      if (chosen) showEditor(chosen); else { openPicker(); showMessage('That element has no sampleable color. Try a filled status or text mark.'); }
    }

    function onEscape(event: KeyboardEvent) { if (event.key === 'Escape') closeDock(); }

    function showEditor(color: string) {
      closeDock();
      const mapping = newMapping(color);
      const dock = document.createElement('form'); dock.className = 'dock'; dock.setAttribute('role', 'dialog'); dock.setAttribute('aria-label', 'Describe sampled color');
      dock.innerHTML = `<h2>Describe this color</h2><p><strong>${mapping.color}</strong> on ${hostName}</p><label>Short label<input name="label" maxlength="16" required value="NOTE"></label><label>Symbol<input name="symbol" maxlength="2" required value="•"></label><label>Pattern<select name="pattern"><option value="dots">Dots</option><option value="stripes">Diagonal stripes</option><option value="crosshatch">Crosshatch</option><option value="solid">Soft solid</option></select></label><div class="actions"></div><small>Your label is a personal note, not an automatic interpretation.</small>`;
      const actions = dock.querySelector('.actions')!;
      const submit = button('Save mapping', () => undefined, true); submit.type = 'submit';
      actions.append(submit, button('Cancel', closeDock));
      dock.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(dock);
        mapping.label = String(data.get('label')).trim().toUpperCase(); mapping.symbol = String(data.get('symbol')).trim(); mapping.pattern = data.get('pattern') as ColorMapping['pattern'];
        if (!mapping.label || !mapping.symbol) return;
        lens.mappings.push(mapping); lens.enabled = true; await updateSite(hostName, lens); closeDock(); scheduleRender();
      });
      ui.append(dock); (dock.elements.namedItem('label') as HTMLInputElement).select();
      addEventListener('keydown', onEscape, true);
    }

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'PING') return Promise.resolve({ enabled: Boolean(config?.globalEnabled && lens?.enabled && sessionEnabled), count: lens?.mappings.length ?? 0, host: hostName });
      if (message.type === 'TOGGLE_LENS') { sessionEnabled = !sessionEnabled; scheduleRender(); return Promise.resolve({ enabled: sessionEnabled }); }
      if (message.type === 'START_PICK') { openPicker(); return Promise.resolve({ ok: true }); }
      if (message.type === 'REFRESH_LENS') { void initialize(); return Promise.resolve({ ok: true }); }
      return undefined;
    });

    browser.storage.onChanged.addListener((changes) => { if (changes[STORAGE_KEY]) void initialize(); });
    addEventListener('scroll', scheduleRender, { passive: true });
    addEventListener('resize', scheduleRender, { passive: true });
    addEventListener('focusin', scheduleRender, true);
    addEventListener('focusout', scheduleRender, true);

    async function initialize() {
      config = await getConfig(); lens = lensFor(config, hostName); scheduleRender();
      observer?.disconnect(); observer = new MutationObserver(scheduleRender); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }
    void initialize();
  }
});
