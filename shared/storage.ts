import { browser } from 'wxt/browser';
import { DEFAULT_CONFIG, STARTER_MAPPINGS, STORAGE_KEY, type LensConfig, type SiteLens } from './types';

export async function getConfig(): Promise<LensConfig> {
  const saved = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] as LensConfig | undefined;
  return saved ?? structuredClone(DEFAULT_CONFIG);
}

export async function saveConfig(config: LensConfig) {
  await browser.storage.local.set({ [STORAGE_KEY]: config });
}

export function lensFor(config: LensConfig, host: string): SiteLens {
  return config.sites[host] ?? { enabled: true, mappings: structuredClone(STARTER_MAPPINGS) };
}

export async function updateSite(host: string, lens: SiteLens) {
  const config = await getConfig();
  config.sites[host] = lens;
  await saveConfig(config);
  return config;
}
