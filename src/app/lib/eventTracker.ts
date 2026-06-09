import { apiEnabled, fetchApiEventSummary, postApiEvent } from './api';

type TrackMetadata = Record<string, string | number | boolean | null | undefined>;

const LOCAL_EVENTS_KEY = 'go_kyrgyzstan_travel_site_events';

function safeMetadata(metadata: TrackMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value).slice(0, 240)])
  );
}

function appendLocalEvent(payload: Record<string, unknown>) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]') as unknown[];
    localStorage.setItem(
      LOCAL_EVENTS_KEY,
      JSON.stringify([{ ...payload, createdAt: new Date().toISOString() }, ...existing].slice(0, 80))
    );
  } catch {
    // Tracking must never break the user flow.
  }
}

function readLocalEvents() {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]') as Array<{
      source?: string;
      eventName?: string;
      path?: string;
      label?: string;
      createdAt?: string;
    }>;
    return Array.isArray(existing) ? existing : [];
  } catch {
    return [];
  }
}

export function trackEvent(
  eventName: string,
  metadata: TrackMetadata = {},
  options: { label?: string } = {},
) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    source: 'web',
    eventName,
    path: `${window.location.pathname}${window.location.search}`,
    label: options.label || String(metadata.label || ''),
    metadata: {
      ...safeMetadata(metadata),
      theme: document.documentElement.dataset.themePreference || 'system',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    },
  };

  if (!apiEnabled) {
    appendLocalEvent(payload);
    return;
  }

  postApiEvent(payload).catch(() => appendLocalEvent(payload));
}

export async function fetchEventSummary() {
  if (apiEnabled) {
    return fetchApiEventSummary();
  }

  const events = readLocalEvents();
  const totals = events.reduce<Record<string, number>>((acc, event) => {
    const name = event.eventName || 'unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return {
    totals,
    recent: events.slice(0, 40).map((event) => ({
      source: event.source || 'web',
      event_name: event.eventName || 'unknown',
      path: event.path || '',
      label: event.label || '',
      created_at: event.createdAt || '',
    })),
  };
}
