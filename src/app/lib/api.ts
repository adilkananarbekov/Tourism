import type { Tour } from '../components/tour-data';
import type {
  BlogPost,
  BookingRequest,
  ContentSettings,
  CustomTourRequest,
  FeedbackEntry,
  SellerSubmission,
  Sight,
  UserRecord,
} from './dataStore';

type ApiTourRow = Partial<Tour> & {
  tour_type?: string;
  packing_list?: string[];
  practical_info?: Tour['practicalInfo'];
  is_hot?: boolean;
  is_active?: boolean;
};

const configuredApiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';
const apiBaseUrl =
  configuredApiBaseUrl ||
  (import.meta.env.PROD && typeof window !== 'undefined' ? window.location.origin : '');
const toursPath = (import.meta.env.VITE_API_TOURS_PATH as string | undefined) || '/api/tours';
const guestRequestsPath =
  (import.meta.env.VITE_API_GUEST_REQUESTS_PATH as string | undefined) || '/api/guest-requests';
const eventsPath = (import.meta.env.VITE_API_EVENTS_PATH as string | undefined) || '/api/events';
const adminTokenKey = 'go-kyrgyzstan-travel-admin-token';
const userTokenKey = 'go-kyrgyzstan-travel-user-token';

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
    isHot: Boolean(row.isHot ?? row.is_hot),
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

async function requestUserJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(userTokenKey) : '';
  return requestJson<T>(path, {
    ...init,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      ...init?.headers,
    },
  });
}

type UserSessionResponse = {
  token: string;
  user: UserRecord;
};

function storeUserSession(session: UserSessionResponse) {
  if (typeof localStorage !== 'undefined' && session.token) {
    localStorage.setItem(userTokenKey, session.token);
  }
  return session.user;
}

export function clearApiUserSession() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(userTokenKey);
  }
}

export function hasApiUserSession() {
  return (
    typeof localStorage !== 'undefined' &&
    Boolean(localStorage.getItem(userTokenKey))
  );
}

export async function signUpApiUser(payload: {
  name: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller';
}) {
  const result = await requestJson<UserSessionResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return storeUserSession(result);
}

export async function signInApiUser(email: string, password: string) {
  const result = await requestJson<UserSessionResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return storeUserSession(result);
}

export async function fetchApiCurrentUser() {
  const result = await requestUserJson<{ user: UserRecord }>('/api/auth/me');
  return result.user;
}

export async function updateApiCurrentUser(payload: {
  name?: string;
  role?: 'buyer' | 'seller';
}) {
  const result = await requestUserJson<UserSessionResponse>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return storeUserSession(result);
}

export async function fetchApiAdminSights(): Promise<Sight[]> {
  const result = await requestAdminJson<{ sights?: Sight[] }>('/api/admin/sights');
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

export async function fetchApiAdminBlogPosts(): Promise<BlogPost[]> {
  const result = await requestAdminJson<{ posts?: BlogPost[] }>('/api/admin/blog-posts');
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
    countryOfResidence: data.countryOfResidence || '',
    contactPreference: data.contactPreference || '',
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
    countryOfResidence: data.countryOfResidence || '',
    contactPreference: data.contactPreference || '',
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
  return requestAdminJson<{
    totals: Record<string, number>;
    paths: Array<{ path: string; count: number }>;
    interests: Array<{ label: string; count: number }>;
    recent: Array<{
      source: string;
      event_name: string;
      path: string;
      label: string;
      created_at: string;
    }>;
  }>('/api/admin/events');
}

export type ApiGuestRequest = {
  id: string;
  type: 'booking' | 'custom_tour_request';
  payload: Record<string, unknown>;
  status?: string;
  telegram_delivery_status?: string;
  telegram_attempts?: number;
  telegram_sent_at?: string;
  telegram_error?: string;
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

export type TelegramAdminStatus = {
  configured: boolean;
  registeredChatCount: number;
  allowedUsernameCount: number;
  webhookConfigured: boolean;
  pollingEnabled: boolean;
  undeliveredRequestCount: number;
};

export async function fetchApiTelegramStatus() {
  return requestAdminJson<TelegramAdminStatus>('/api/admin/telegram/status');
}

export async function sendApiTelegramTest() {
  return requestAdminJson<{ sent: number; failed: number; errors?: string[] }>(
    '/api/admin/telegram/test',
    { method: 'POST' }
  );
}

export async function retryApiTelegramRequests() {
  return requestAdminJson<{ status: string; undeliveredRequestCount: number }>(
    '/api/admin/telegram/retry',
    { method: 'POST' }
  );
}

export async function fetchApiUserBookings() {
  const result = await requestUserJson<{ bookings?: ApiGuestRequest[] }>('/api/user/bookings');
  return result.bookings || [];
}

export async function createApiSellerSubmission(
  submission: Omit<SellerSubmission, 'id' | 'status'>
) {
  const result = await requestUserJson<{ submission: SellerSubmission }>('/api/seller-submissions', {
    method: 'POST',
    body: JSON.stringify(submission),
  });
  return result.submission;
}

export async function fetchApiSellerSubmissions() {
  const result = await requestUserJson<{ submissions?: SellerSubmission[] }>('/api/seller-submissions');
  return result.submissions || [];
}

export async function fetchApiAdminSellerSubmissions() {
  const result = await requestAdminJson<{ submissions?: SellerSubmission[] }>(
    '/api/admin/seller-submissions'
  );
  return result.submissions || [];
}

export async function updateApiAdminSellerSubmissionStatus(id: string, status: string) {
  const result = await requestAdminJson<{ submission: SellerSubmission }>(
    `/api/admin/seller-submissions/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  return result.submission;
}

export async function createApiFeedback(feedback: Omit<FeedbackEntry, 'id'>) {
  const result = await requestJson<{ feedback: FeedbackEntry }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
  return result.feedback;
}

export async function fetchApiAdminFeedback() {
  const result = await requestAdminJson<{ feedback?: FeedbackEntry[] }>('/api/admin/feedback');
  return result.feedback || [];
}

export async function updateApiAdminFeedback(
  id: string,
  updates: Pick<FeedbackEntry, 'adminResponse'> & { isPublished?: boolean }
) {
  const result = await requestAdminJson<{ feedback: FeedbackEntry }>(`/api/admin/feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return result.feedback;
}

export async function fetchApiAdminUsers() {
  const result = await requestAdminJson<{ users?: UserRecord[] }>('/api/admin/users');
  return result.users || [];
}

export async function updateApiAdminUserRole(id: string, role: string) {
  const result = await requestAdminJson<{ user: UserRecord }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return result.user;
}
