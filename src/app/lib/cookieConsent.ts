export type CookieConsent = {
  version: 1;
  analytics: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_CHANGED_EVENT = 'go-kyrgyzstan-cookie-consent-changed';

const CONSENT_COOKIE_NAME = 'gkt_cookie_consent';
const ANALYTICS_SESSION_COOKIE_NAME = 'gkt_analytics_session';
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 395;
const ANALYTICS_SESSION_MAX_AGE_SECONDS = 60 * 30;

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
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
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
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  const existing = readCookie(ANALYTICS_SESSION_COOKIE_NAME);
  const sessionId = existing || createSessionId();
  writeCookie(ANALYTICS_SESSION_COOKIE_NAME, sessionId, ANALYTICS_SESSION_MAX_AGE_SECONDS);
  return sessionId;
}
