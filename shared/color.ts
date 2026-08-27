export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('').toUpperCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

export function cssColorToHex(value: string): string | null {
  const hex = normalizeHex(value);
  if (hex) return hex;
  const match = value.match(/rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)(?:\D+(\d*(?:\.\d+)?))?\s*\)/i);
  if (!match) return null;
  if (match[4] !== undefined && Number(match[4]) === 0) return null;
  const parts = [1, 2, 3].map((index) => Math.max(0, Math.min(255, Math.round(Number(match[index])))));
  return `#${parts.map((part) => part.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function colorDistance(a: string, b: string): number {
  const first = normalizeHex(a);
  const second = normalizeHex(b);
  if (!first || !second) return Number.POSITIVE_INFINITY;
  const channels = (hex: string) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const [ar = 0, ag = 0, ab = 0] = channels(first);
  const [br = 0, bg = 0, bb = 0] = channels(second);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

export function bestMatch(colors: string[], mappings: { color: string; tolerance: number }[]) {
  let winner: { index: number; distance: number } | null = null;
  for (let index = 0; index < mappings.length; index++) {
    const mapping = mappings[index];
    if (!mapping) continue;
    for (const color of colors) {
      const distance = colorDistance(color, mapping.color);
      if (distance <= mapping.tolerance && (!winner || distance < winner.distance)) winner = { index, distance };
    }
  }
  return winner === null ? -1 : winner.index;
}
