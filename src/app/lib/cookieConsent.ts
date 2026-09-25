export type CookieConsent = {
  version: 1;
  analytics: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_CHANGED_EVENT = 'go-kyrgyzstan-cookie-consent-changed';

const CONSENT_COOKIE_NAME = 'gkt_cookie_consent';
const ANALYTICS_SESSION_COOKIE_NAME = 'gkt_analytics_session';
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 395;
export const ANALYTICS_SESSION_MAX_AGE_SECONDS = 60 * 30;
const RFC4122_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readCookie(name: string) {
  if (!isBrowser()) {
    return '';
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(prefix));
  if (!cookie) {
    return '';
  }

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    // Treat malformed or manually edited cookie values as missing. A broken
    // percent-escape must never prevent the site or cookie controls from loading.
    return '';
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuid = crypto.randomUUID();
    if (RFC4122_UUID_PATTERN.test(uuid)) {
      return uuid.toLowerCase();
    }
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  // RFC 4122 version 4 and variant 1 bits. Even the compatibility fallback
  // keeps the same UUID shape expected by the analytics API.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function doNotTrackEnabled() {
  if (!isBrowser()) {
    return false;
  }

  const browserWindow = window as Window & { doNotTrack?: string };
  return navigator.doNotTrack === '1' || browserWindow.doNotTrack === '1';
}

export function getCookieConsent(): CookieConsent | null {
  const value = readCookie(CONSENT_COOKIE_NAME);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<CookieConsent>;
    if (parsed.version !== 1 || typeof parsed.analytics !== 'boolean' || typeof parsed.updatedAt !== 'string') {
      return null;
    }
    return { version: 1, analytics: parsed.analytics, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return Boolean(getCookieConsent()?.analytics) && !doNotTrackEnabled();
}

export function setCookieConsent(analytics: boolean) {
  const consent: CookieConsent = {
    version: 1,
    analytics,
    updatedAt: new Date().toISOString(),
  };

  writeCookie(CONSENT_COOKIE_NAME, JSON.stringify(consent), CONSENT_MAX_AGE_SECONDS);
  if (!analytics) {
    deleteCookie(ANALYTICS_SESSION_COOKIE_NAME);
  }

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: consent }));
  }

  return consent;
}

export function openCookieSettings() {
  if (isBrowser()) {
    window.dispatchEvent(new Event('go-kyrgyzstan-open-cookie-settings'));
  }
}

export function getAnalyticsSessionId() {
  if (!hasAnalyticsConsent()) {
    return '';
  }

  const existing = readCookie(ANALYTICS_SESSION_COOKIE_NAME).toLowerCase();
  const sessionId = RFC4122_UUID_PATTERN.test(existing) ? existing : createSessionId();
  writeCookie(ANALYTICS_SESSION_COOKIE_NAME, sessionId, ANALYTICS_SESSION_MAX_AGE_SECONDS);
  return sessionId;
}
