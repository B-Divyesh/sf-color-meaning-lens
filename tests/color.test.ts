import { describe, expect, it } from 'vitest';
import { bestMatch, colorDistance, cssColorToHex, normalizeHex } from '../shared/color';

describe('color utilities', () => {
  it('normalizes short and long hex values', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('16a34a')).toBe('#16A34A');
    expect(normalizeHex('not-a-color')).toBeNull();
  });

  it('reads opaque CSS rgb values and ignores transparent colors', () => {
    expect(cssColorToHex('rgb(22, 163, 74)')).toBe('#16A34A');
    expect(cssColorToHex('rgba(1, 2, 3, 0)')).toBeNull();
  });

  it('picks the nearest mapping inside tolerance', () => {
    const mappings = [{ color: '#16A34A', tolerance: 20 }, { color: '#DC2626', tolerance: 20 }];
    expect(bestMatch(['#18A64C'], mappings)).toBe(0);
    expect(bestMatch(['#999999'], mappings)).toBe(-1);
    expect(colorDistance('#000000', '#030400')).toBe(5);
  });
});
