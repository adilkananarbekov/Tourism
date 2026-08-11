import { apiEnabled, fetchApiEventSummary, postApiEvent } from './api';
import { getAnalyticsSessionId, hasAnalyticsConsent } from './cookieConsent';

type TrackMetadata = Record<string, string | number | boolean | null | undefined>;

function safeMetadata(metadata: TrackMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value).slice(0, 240)])
  );
}

export function trackEvent(
  eventName: string,
  metadata: TrackMetadata = {},
  options: { label?: string } = {},
) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) {
    return;
  }

  const payload = {
    source: 'web',
    eventName,
    path: window.location.pathname,
    label: options.label || String(metadata.label || ''),
    metadata: {
      ...safeMetadata(metadata),
      sessionId: getAnalyticsSessionId(),
      theme: document.documentElement.dataset.themePreference || 'system',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    },
  };

  if (!apiEnabled) {
    return;
  }

  postApiEvent(payload).catch(() => undefined);
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
