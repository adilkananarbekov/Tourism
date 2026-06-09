import type { Tour } from '../components/tour-data';
import type { BlogPost, BookingRequest, ContentSettings, CustomTourRequest, Sight } from './dataStore';

type ApiTourRow = Partial<Tour> & {
  tour_type?: string;
  packing_list?: string[];
  practical_info?: Tour['practicalInfo'];
  is_active?: boolean;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';
const toursPath = (import.meta.env.VITE_API_TOURS_PATH as string | undefined) || '/api/tours';
const guestRequestsPath =
  (import.meta.env.VITE_API_GUEST_REQUESTS_PATH as string | undefined) || '/api/guest-requests';
const eventsPath = (import.meta.env.VITE_API_EVENTS_PATH as string | undefined) || '/api/events';
const adminTokenKey = 'go-kyrgyzstan-travel-admin-token';

export const apiEnabled = Boolean(apiBaseUrl);

function apiUrl(path: string) {
  if (!apiBaseUrl) {
    throw new Error('API is not configured. Add VITE_API_BASE_URL.');
  }
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'omit',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok) {
    throw new Error(String(result.error || result.message || 'API request failed.'));
  }
  return result as T;
}

async function requestAdminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(adminTokenKey) : '';
  return requestJson<T>(path, {
    ...init,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      ...init?.headers,
    },
  });
}

function normalizeTour(row: ApiTourRow): Tour {
  return {
    id: Number(row.id),
    title: row.title || '',
    duration: row.duration || '',
    tourType: row.tourType || row.tour_type || '',
    season: row.season || '',
    description: row.description || '',
    image: row.image || '',
    price: row.price || '',
    locations: row.locations || [],
    highlights: row.highlights || [],
    itinerary: row.itinerary || [],
    packingList: row.packingList || row.packing_list || [],
    practicalInfo: row.practicalInfo || row.practical_info || {
      accommodation: '',
      meals: '',
      difficulty: '',
      groupSize: '',
      included: [],
      notIncluded: [],
    },
  };
}

export async function fetchApiTours(): Promise<Tour[]> {
  const result = await requestJson<ApiTourRow[] | { tours?: ApiTourRow[]; data?: ApiTourRow[] }>(toursPath);
  const rows = Array.isArray(result) ? result : result.tours || result.data || [];
  return rows.filter((row) => row.is_active !== false).map(normalizeTour);
}

export async function fetchApiAdminTours(): Promise<Tour[]> {
  const result = await requestAdminJson<{ tours?: ApiTourRow[] }>('/api/admin/tours');
  return (result.tours || []).filter((row) => row.is_active !== false).map(normalizeTour);
}

export async function createApiTour(tour: Tour): Promise<Tour> {
  const result = await requestAdminJson<{ tour: ApiTourRow }>('/api/admin/tours', {
    method: 'POST',
    body: JSON.stringify(tour),
  });
  return normalizeTour(result.tour);
}

export async function updateApiTour(tourId: number, updates: Partial<Tour>): Promise<Tour> {
  const result = await requestAdminJson<{ tour: ApiTourRow }>(`/api/admin/tours/${tourId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return normalizeTour(result.tour);
}

export async function deleteApiTour(tourId: number): Promise<void> {
  await requestAdminJson(`/api/admin/tours/${tourId}`, {
    method: 'DELETE',
  });
}

export async function fetchApiSights(): Promise<Sight[]> {
  const result = await requestJson<{ sights?: Sight[] }>('/api/sights');
  return result.sights || [];
}

export async function createApiSight(sight: Omit<Sight, 'id'>): Promise<Sight> {
  const result = await requestAdminJson<{ sight: Sight }>('/api/admin/sights', {
    method: 'POST',
    body: JSON.stringify(sight),
  });
  return result.sight;
}

export async function updateApiSight(sightId: string, updates: Partial<Sight>): Promise<Sight> {
  const result = await requestAdminJson<{ sight: Sight }>(`/api/admin/sights/${sightId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return result.sight;
}

export async function deleteApiSight(sightId: string): Promise<void> {
  await requestAdminJson(`/api/admin/sights/${sightId}`, {
    method: 'DELETE',
  });
}

export async function fetchApiBlogPosts(): Promise<BlogPost[]> {
  const result = await requestJson<{ posts?: BlogPost[] }>('/api/blog-posts');
  return result.posts || [];
}

export async function createApiBlogPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  const result = await requestAdminJson<{ post: BlogPost }>('/api/admin/blog-posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
  return result.post;
}

export async function updateApiBlogPost(postId: string, updates: Partial<BlogPost>): Promise<BlogPost> {
  const result = await requestAdminJson<{ post: BlogPost }>(`/api/admin/blog-posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return result.post;
}

export async function deleteApiBlogPost(postId: string): Promise<void> {
  await requestAdminJson(`/api/admin/blog-posts/${postId}`, {
    method: 'DELETE',
  });
}

export async function fetchApiContentSettings(): Promise<ContentSettings | null> {
  const result = await requestJson<{ settings?: ContentSettings }>('/api/content-settings');
  return result.settings || null;
}

export async function updateApiContentSettings(settings: ContentSettings): Promise<ContentSettings> {
  const result = await requestAdminJson<{ settings: ContentSettings }>('/api/admin/content-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return result.settings;
}

export async function uploadApiImage(file: File, folder: string): Promise<string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(adminTokenKey) : '';
  const safeFolder = folder.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'general';
  const response = await fetch(apiUrl(`/api/admin/uploads/${safeFolder}`), {
    method: 'POST',
    credentials: 'omit',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': file.name.replace(/[^\x20-\x7E]+/g, '') || 'image',
    },
    body: file,
  });
  const result = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok) {
    throw new Error(String(result.error || result.message || 'Image upload failed.'));
  }
  return String(result.url || '');
}

async function submitGuestRequest(type: 'booking' | 'custom_tour_request', payload: Record<string, unknown>) {
  await requestJson(guestRequestsPath, {
    method: 'POST',
    body: JSON.stringify({ type, payload }),
  });
}

export async function submitApiBookingRequest(data: BookingRequest) {
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

export async function submitApiCustomTourRequest(data: CustomTourRequest) {
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

export function postApiEvent(payload: Record<string, unknown>) {
  if (!apiEnabled) {
    return Promise.resolve();
  }
  return requestJson(eventsPath, {
    method: 'POST',
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

export async function fetchApiEventSummary() {
  return requestJson<{
    totals: Record<string, number>;
    recent: Array<{
      source: string;
      event_name: string;
      path: string;
      label: string;
      created_at: string;
    }>;
  }>(eventsPath);
}

export type ApiGuestRequest = {
  id: string;
  type: 'booking' | 'custom_tour_request';
  payload: Record<string, unknown>;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchApiAdminGuestRequests() {
  const result = await requestAdminJson<{ requests?: ApiGuestRequest[] }>('/api/admin/guest-requests');
  return result.requests || [];
}

export async function updateApiAdminGuestRequestStatus(requestId: string, status: string) {
  await requestAdminJson(`/api/admin/guest-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
