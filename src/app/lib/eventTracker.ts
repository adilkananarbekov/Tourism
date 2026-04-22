import { supabaseProjectUrl } from './supabase';

type TrackMetadata = Record<string, string | number | boolean | null | undefined>;

const EVENT_FUNCTION =
  (import.meta.env.VITE_SUPABASE_EVENT_TRACK_FUNCTION as string | undefined) || 'event-track';
const LOCAL_EVENTS_KEY = 'tourism_site_events';

function getEventUrl() {
  if (!supabaseProjectUrl) {
    return '';
  }
  return `${supabaseProjectUrl.replace(/\/$/, '')}/functions/v1/${EVENT_FUNCTION}`;
}

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

  const url = getEventUrl();
  if (!url) {
    appendLocalEvent(payload);
    return;
  }

  const body = JSON.stringify(payload);
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'omit',
    keepalive: true,
  }).catch(() => appendLocalEvent(payload));
}

export async function fetchEventSummary() {
  const url = getEventUrl();
  if (!url) {
    return { totals: {}, recent: [] };
  }

  const response = await fetch(url, { credentials: 'omit' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(result.error || 'Unable to load event tracker.'));
  }

  return result as {
    totals: Record<string, number>;
    recent: Array<{
      source: string;
      event_name: string;
      path: string;
      label: string;
      created_at: string;
    }>;
  };
}
