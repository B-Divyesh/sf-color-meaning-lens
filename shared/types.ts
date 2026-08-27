export type Pattern = 'dots' | 'stripes' | 'crosshatch' | 'solid';

export interface ColorMapping {
  id: string;
  color: string;
  label: string;
  symbol: string;
  pattern: Pattern;
  tolerance: number;
}

export interface SiteLens {
  enabled: boolean;
  mappings: ColorMapping[];
}

export interface LensConfig {
  globalEnabled: boolean;
  sites: Record<string, SiteLens>;
}

export const STORAGE_KEY = 'lensConfig:v1';

export const STARTER_MAPPINGS: ColorMapping[] = [
  { id: 'starter-pass', color: '#16A34A', label: 'PASS', symbol: '✓', pattern: 'dots', tolerance: 58 },
  { id: 'starter-warn', color: '#CA8A04', label: 'WARN', symbol: '!', pattern: 'stripes', tolerance: 58 },
  { id: 'starter-fail', color: '#DC2626', label: 'FAIL', symbol: '×', pattern: 'crosshatch', tolerance: 58 }
];

export const DEFAULT_CONFIG: LensConfig = { globalEnabled: true, sites: {} };

export function newMapping(color = '#164B78'): ColorMapping {
  return {
    id: crypto.randomUUID(), color: color.toUpperCase(), label: 'NOTE', symbol: '•', pattern: 'dots', tolerance: 45
  };
}
