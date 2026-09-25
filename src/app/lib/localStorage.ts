import type { BookingRequest, SellerSubmission } from './dataStore';
import { apiEnabled } from './api';

const PROFILE_KEY = 'go_kyrgyzstan_travel_profile';
const BOOKINGS_KEY = 'go_kyrgyzstan_travel_bookings';
const SUBMISSIONS_KEY = 'go_kyrgyzstan_travel_seller_submissions';
const LEGACY_SENSITIVE_KEYS = [
  PROFILE_KEY,
  BOOKINGS_KEY,
  SUBMISSIONS_KEY,
  'go_kyrgyzstan_travel_data_customTourRequests',
  'go_kyrgyzstan_travel_data_bookings',
  'go_kyrgyzstan_travel_data_feedback',
  'go_kyrgyzstan_travel_data_users',
  'go_kyrgyzstan_travel_data_sellerSubmissions',
] as const;

export type LocalProfile = {
  name: string;
  email: string;
  role: 'buyer' | 'seller';
};

export type LocalBooking = BookingRequest & {
  submittedAt: string;
};

export type LocalSubmission = SellerSubmission & {
  submittedAt: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadLocalProfile(): LocalProfile | null {
  if (apiEnabled) {
    return null;
  }
  const data = safeParse<LocalProfile | null>(localStorage.getItem(PROFILE_KEY), null);
  if (!data || !data.email || !data.role || !data.name) {
    return null;
  }
  return data;
}

export function saveLocalProfile(profile: LocalProfile) {
  if (apiEnabled) {
    return;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadLocalBookings(): LocalBooking[] {
  if (apiEnabled) {
    return [];
  }
  const items = safeParse<LocalBooking[]>(localStorage.getItem(BOOKINGS_KEY), []);
  return Array.isArray(items) ? items : [];
}

export function appendLocalBooking(booking: BookingRequest) {
  if (apiEnabled) {
    return;
  }
  const existing = loadLocalBookings();
  const entry: LocalBooking = {
    ...booking,
    status: booking.status || 'pending',
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify([entry, ...existing]));
}

export function loadLocalSubmissions(): LocalSubmission[] {
  if (apiEnabled) {
    return [];
  }
  const items = safeParse<LocalSubmission[]>(localStorage.getItem(SUBMISSIONS_KEY), []);
  return Array.isArray(items) ? items : [];
}

export function appendLocalSubmission(submission: Omit<SellerSubmission, 'id' | 'status'>) {
  if (apiEnabled) {
    return;
  }
  const existing = loadLocalSubmissions();
  const entry: LocalSubmission = {
    ...submission,
    id: `${Date.now()}`,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([entry, ...existing]));
}

export function clearLegacySensitiveLocalData() {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    LEGACY_SENSITIVE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Browser privacy modes can expose localStorage while denying access.
  }
}
