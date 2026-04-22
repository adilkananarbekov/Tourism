import { supabaseProjectUrl } from './supabase';
import type { BookingRequest, CustomTourRequest } from './firestore';

type GuestRequestType = 'booking' | 'custom_tour_request';

const guestRequestFunctionName =
  (import.meta.env.VITE_SUPABASE_GUEST_REQUEST_FUNCTION as string | undefined) || 'guest-request';

function getGuestRequestUrl() {
  if (!supabaseProjectUrl) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL.');
  }
  return `${supabaseProjectUrl.replace(/\/$/, '')}/functions/v1/${guestRequestFunctionName}`;
}

async function submitGuestRequest(type: GuestRequestType, payload: Record<string, unknown>) {
  const response = await fetch(getGuestRequestUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, payload }),
  });

  const result = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok) {
    throw new Error(String(result.error || 'Unable to submit request.'));
  }
}

export async function submitSupabaseBookingRequest(data: BookingRequest) {
  await submitGuestRequest('booking', {
    tourId: data.tourId,
    tourTitle: data.tourTitle,
    name: data.name,
    email: data.email,
    telegramUsername: data.telegramUsername || '',
    phone: data.phone || '',
    participants: data.participants,
    startDate: data.startDate,
    endDate: data.endDate,
    dateFlexibility: data.dateFlexibility || '',
    notes: data.notes || '',
    pricePerPerson: data.pricePerPerson,
    totalPrice: data.totalPrice,
    userId: data.userId || null,
  });
}

export async function submitSupabaseCustomTourRequest(data: CustomTourRequest) {
  await submitGuestRequest('custom_tour_request', {
    groupSize: data.groupSize,
    startDate: data.startDate,
    endDate: data.endDate,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    sights: data.sights || [],
    activities: data.activities || [],
    pace: data.pace,
    accommodation: data.accommodation,
    name: data.name,
    email: data.email,
    telegramUsername: data.telegramUsername || '',
    phone: data.phone,
    budget: data.budget || '',
    specialRequests: data.specialRequests || '',
    dateFlexibility: data.dateFlexibility || '',
    userId: data.userId || null,
  });
}
