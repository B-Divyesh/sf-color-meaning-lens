export const PRODUCT_SLUG = 'color-meaning-lens';
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
export const VERDICT_KEY = `sb_license_verdict:${PRODUCT_SLUG}`;
export const CHECKOUT_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/checkout`;
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify`;
const DAY = 86_400_000;

export interface LicenseVerdict { valid: boolean; reason: string; checkedAt: number }

export function captureLicenseFromUrl(storage: Storage = localStorage) {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return null;
  storage.setItem(LICENSE_KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token;
}

export function cachedLicense(storage: Storage = localStorage): { token: string; verdict: LicenseVerdict | null } | null {
  const token = storage.getItem(LICENSE_KEY)?.trim();
  if (!token) return null;
  try { return { token, verdict: JSON.parse(storage.getItem(VERDICT_KEY) ?? 'null') as LicenseVerdict | null }; }
  catch { return { token, verdict: null }; }
}

export async function verifyLicense(token: string, storage: Storage = localStorage, force = false): Promise<LicenseVerdict> {
  const current = cachedLicense(storage);
  if (!force && current?.token === token && current.verdict && Date.now() - current.verdict.checkedAt < DAY) return current.verdict;
  const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('The license service did not respond.');
  const result = await response.json() as { valid: boolean; reason: string };
  const verdict = { valid: Boolean(result.valid), reason: result.reason, checkedAt: Date.now() };
  storage.setItem(LICENSE_KEY, token); storage.setItem(VERDICT_KEY, JSON.stringify(verdict));
  return verdict;
}

export function saveLicenseToken(token: string, storage: Storage = localStorage) {
  storage.setItem(LICENSE_KEY, token.trim()); storage.removeItem(VERDICT_KEY);
}
