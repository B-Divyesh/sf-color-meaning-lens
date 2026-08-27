import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, STARTER_MAPPINGS, newMapping } from '../shared/types';

describe('lens defaults', () => {
  it('ships useful redundant starter mappings', () => {
    expect(DEFAULT_CONFIG.globalEnabled).toBe(true);
    expect(STARTER_MAPPINGS.map((mapping) => mapping.label)).toEqual(['PASS', 'WARN', 'FAIL']);
    expect(new Set(STARTER_MAPPINGS.map((mapping) => mapping.pattern)).size).toBe(3);
    expect(new Set(STARTER_MAPPINGS.map((mapping) => mapping.symbol)).size).toBe(3);
  });

  it('creates an editable personal note', () => {
    const mapping = newMapping('#123456');
    expect(mapping.color).toBe('#123456');
    expect(mapping.label).toBe('NOTE');
    expect(mapping.tolerance).toBeGreaterThan(0);
  });
});
