import { browser } from 'wxt/browser';

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-lens') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_LENS' }).catch(() => undefined);
  });
});
