import { apiEnabled, fetchApiEventSummary, postApiEvent } from './api';
import {
  ANALYTICS_SESSION_MAX_AGE_SECONDS,
  getAnalyticsSessionId,
  hasAnalyticsConsent,
} from './cookieConsent';

type TrackMetadata = Record<string, string | number | boolean | null | undefined>;

const ATTRIBUTION_VALUE_LIMIT = 80;
const ATTRIBUTION_STORAGE_KEY = 'gkt_analytics_attribution_v1';

type StoredAttribution = {
  i: string;
  e: number;
  l: string;
  r?: string;
  s?: string;
  m?: string;
  c?: string;
  p?: 1;
};

let memoryAttribution: StoredAttribution | null = null;
let lastDocumentSessionId: string | null = null;

function safeMetadata(metadata: TrackMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => key !== 'label' && value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value).slice(0, 120)])
      .filter(([, value]) => value !== '')
  );
}

function createAttribution(sessionId: string, includeDocumentSource: boolean): StoredAttribution {
  const clean = (value: string | null) =>
    String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, ATTRIBUTION_VALUE_LIMIT);
  const query = includeDocumentSource
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
  let referrerHost = '';

  try {
    const referrer = includeDocumentSource && document.referrer ? new URL(document.referrer) : null;
    if (referrer && referrer.hostname !== window.location.hostname) {
      referrerHost = clean(referrer.hostname.toLowerCase());
    }
  } catch {
    referrerHost = '';
  }

  const compact: StoredAttribution = {
    i: sessionId,
    e: Date.now() + ANALYTICS_SESSION_MAX_AGE_SECONDS * 1000,
    l: window.location.pathname.slice(0, 160),
  };
  const values = {
    r: referrerHost,
    s: clean(query.get('utm_source')),
    m: clean(query.get('utm_medium')),
    c: clean(query.get('utm_campaign')),
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      compact[key as keyof Pick<StoredAttribution, 'r' | 's' | 'm' | 'c'>] = value;
    }
  });
  return compact;
}

function persistAttribution(attribution: StoredAttribution) {
  memoryAttribution = attribution;
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Analytics still works when a browser blocks session storage.
  }
}

function readAttribution(sessionId: string): StoredAttribution {
  const now = Date.now();
  let stored = memoryAttribution;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || 'null') as StoredAttribution | null;
    if (parsed && typeof parsed === 'object') {
      stored = parsed;
    }
  } catch {
    // A malformed value is replaced with a new, consented attribution record.
  }

  if (
    stored?.i === sessionId &&
    typeof stored.l === 'string' &&
    stored.l.startsWith('/') &&
    Number.isFinite(stored.e) &&
    stored.e > now
  ) {
    stored.e = now + ANALYTICS_SESSION_MAX_AGE_SECONDS * 1000;
    lastDocumentSessionId = sessionId;
    persistAttribution(stored);
    return stored;
  }

  // A session that changes while the same document remains open is a new
  // direct visit. On a fresh document, current referrer/UTM values are valid.
  const includeDocumentSource = lastDocumentSessionId === null;
  const attribution = createAttribution(sessionId, includeDocumentSource);
  lastDocumentSessionId = sessionId;
  persistAttribution(attribution);
  return attribution;
}

function attributionMetadata(eventName: string, sessionId: string) {
  const isConversion = eventName === 'request_form_submit_success' || eventName === 'tour_request_submit_success';
  const attribution = readAttribution(sessionId);
  if (eventName !== 'page_view' && !isConversion) {
    return {};
  }
  if (eventName === 'page_view' && attribution.p) {
    return {};
  }
  if (eventName === 'page_view') {
    attribution.p = 1;
    persistAttribution(attribution);
  }
  return safeMetadata({
    landing: attribution.l,
    referrerHost: attribution.r,
    utmSource: attribution.s,
    utmMedium: attribution.m,
    utmCampaign: attribution.c,
  });
}

function deviceClass() {
  if (window.innerWidth < 640) {
    return 'mobile';
  }
  if (window.innerWidth < 1024) {
    return 'tablet';
  }
  return 'desktop';
}

export function trackEvent(
  eventName: string,
  metadata: TrackMetadata = {},
  options: { label?: string } = {},
) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) {
    return;
  }

  if (!apiEnabled) {
    return;
  }

  const label = String(options.label || metadata.label || '').slice(0, 120);
  const isPageView = eventName === 'page_view';
  const sessionId = getAnalyticsSessionId();
  if (!sessionId) {
    return;
  }
  const attribution = attributionMetadata(eventName, sessionId);

  const payload = {
    source: 'web',
    eventName,
    path: window.location.pathname,
    label,
    metadata: {
      ...safeMetadata(metadata),
      sessionId,
      ...(isPageView ? { device: deviceClass() } : {}),
      ...attribution,
    },
  };

  postApiEvent(payload).catch(() => undefined);
}

export function clearAnalyticsAttribution() {
  memoryAttribution = null;
  lastDocumentSessionId = null;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
    } catch {
      // Some privacy modes expose storage APIs but reject access.
    }
  }
}

export async function fetchEventSummary() {
  if (apiEnabled) {
    return fetchApiEventSummary();
  }

  return {
    totals: {},
    paths: [],
    interests: [],
    recent: [],
  };
}
