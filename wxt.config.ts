import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist/extension',
  manifest: {
    name: 'Color Meaning Lens',
    description: 'Add removable patterns and your own short labels to page colors.',
    version: '1.0.0',
    icons: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' },
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
    commands: {
      'toggle-lens': {
        suggested_key: { default: 'Alt+Shift+L', mac: 'Alt+Shift+L' },
        description: 'Toggle Color Meaning Lens on this page'
      }
    },
    action: { default_title: 'Color Meaning Lens' }
  }
});
