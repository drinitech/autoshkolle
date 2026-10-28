/**
 * Where to go after login/register, taken from `?next=`. Only same-site paths are
 * accepted ("/quiz?kategoria=…"), never "//evil.com" or absolute URLs (open redirect).
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

/** Reads and validates `?next=` from the current URL (client only). */
export function readNextFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return safeNextPath(new URLSearchParams(window.location.search).get('next'));
}

export function withNext(path: '/login' | '/register', next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
