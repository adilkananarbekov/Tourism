import type { BookingRequest, SellerSubmission } from './firestore';

const PROFILE_KEY = 'tourism_profile';
const BOOKINGS_KEY = 'tourism_bookings';
const SUBMISSIONS_KEY = 'tourism_seller_submissions';

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
  const data = safeParse<LocalProfile | null>(localStorage.getItem(PROFILE_KEY), null);
  if (!data || !data.email || !data.role || !data.name) {
    return null;
  }
  return data;
}

export function saveLocalProfile(profile: LocalProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadLocalBookings(): LocalBooking[] {
  const items = safeParse<LocalBooking[]>(localStorage.getItem(BOOKINGS_KEY), []);
  return Array.isArray(items) ? items : [];
}

export function appendLocalBooking(booking: BookingRequest) {
  const existing = loadLocalBookings();
  const entry: LocalBooking = {
    ...booking,
    status: booking.status || 'pending',
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify([entry, ...existing]));
}

export function loadLocalSubmissions(): LocalSubmission[] {
  const items = safeParse<LocalSubmission[]>(localStorage.getItem(SUBMISSIONS_KEY), []);
  return Array.isArray(items) ? items : [];
}

export function appendLocalSubmission(submission: Omit<SellerSubmission, 'id' | 'status'>) {
  const existing = loadLocalSubmissions();
  const entry: LocalSubmission = {
    ...submission,
    id: `${Date.now()}`,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([entry, ...existing]));
}
