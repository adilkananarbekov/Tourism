import {
  apiEnabled,
  createApiBlogPost,
  createApiFeedback,
  createApiSellerSubmission,
  createApiSight,
  createApiTour,
  deleteApiBlogPost,
  deleteApiSight,
  deleteApiTour,
  fetchApiBlogPosts,
  fetchApiAdminBlogPosts,
  fetchApiContentSettings,
  fetchApiAdminGuestRequests,
  fetchApiAdminFeedback,
  fetchApiAdminSellerSubmissions,
  fetchApiAdminUsers,
  fetchApiAdminTours,
  fetchApiSights,
  fetchApiAdminSights,
  fetchApiTours,
  fetchApiUserBookings,
  fetchApiSellerSubmissions,
  updateApiBlogPost,
  updateApiContentSettings,
  updateApiSight,
  updateApiAdminGuestRequestStatus,
  updateApiAdminFeedback,
  updateApiAdminSellerSubmissionStatus,
  updateApiAdminUserRole,
  updateApiTour,
  submitApiBookingRequest,
  submitApiCustomTourRequest,
  type ApiGuestRequest,
} from './api';
import { tours as fallbackTours, type Tour } from '../components/tour-data';

export interface CustomTourRequest {
  groupSize: number;
  startDate: string;
  endDate: string;
  dateFlexibility?: string;
  startLocation: string;
  endLocation: string;
  sights: string[];
  activities: string[];
  pace: string;
  accommodation: string;
  name: string;
  countryOfResidence: string;
  contactPreference: string;
  email: string;
  telegramUsername?: string;
  phone: string;
  budget: string;
  specialRequests: string;
  userId?: string;
  status?: string;
  telegramDeliveryStatus?: string;
  telegramAttempts?: number;
  telegramSentAt?: string;
  telegramError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingRequest {
  tourId: number;
  tourTitle: string;
  name: string;
  countryOfResidence: string;
  contactPreference: string;
  email: string;
  telegramUsername?: string;
  phone: string;
  participants: number;
  startDate: string;
  endDate: string;
  dateFlexibility?: string;
  notes: string;
  pricePerPerson: string;
  totalPrice: string;
  userId?: string;
  status?: string;
  telegramDeliveryStatus?: string;
  telegramAttempts?: number;
  telegramSentAt?: string;
  telegramError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sight {
  id: string;
  name: string;
  region: string;
  description: string;
  imageUrl: string;
}

export interface BlogPost {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  readTime?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedbackEntry {
  id: string;
  name: string;
  rating: number;
  comments: string;
  adminResponse?: string;
  isPublished?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRecord {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerSubmission {
  id: string;
  title: string;
  duration: string;
  price: string;
  season: string;
  tourType: string;
  description: string;
  highlights: string[];
  itinerary: string[];
  image: string;
  contactName: string;
  contactEmail: string;
  ownerId?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentSettings {
  heroHeadline?: string;
  heroSubheadline?: string;
  contactEmail?: string;
  contactPhone?: string;
}

type Stored<T> = T & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

type CollectionName =
  | 'tours'
  | 'sights'
  | 'blogPosts'
  | 'customTourRequests'
  | 'bookings'
  | 'feedback'
  | 'users'
  | 'sellerSubmissions';

const STORE_PREFIX = 'go_kyrgyzstan_travel_data_';
const CONTENT_SETTINGS_KEY = `${STORE_PREFIX}content_settings`;
const DATA_EVENT = 'go_kyrgyzstan_travel_data_change';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function collectionKey(name: CollectionName) {
  return `${STORE_PREFIX}${name}`;
}

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

function readCollection<T extends { id: string | number }>(name: CollectionName): T[] {
  if (!canUseStorage()) {
    return [];
  }
  const items = safeParse<T[]>(localStorage.getItem(collectionKey(name)), []);
  return Array.isArray(items) ? items : [];
}

function writeCollection<T extends { id: string | number }>(name: CollectionName, items: T[]) {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(collectionKey(name), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: name }));
}

function now() {
  return new Date().toISOString();
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortNewest<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function fromApiGuestRequest<T extends object>(request: ApiGuestRequest): Stored<T> {
  return {
    ...(request.payload as T),
    id: request.id,
    status: request.status || 'pending',
    telegramDeliveryStatus: request.telegram_delivery_status || 'waiting',
    telegramAttempts: request.telegram_attempts || 0,
    telegramSentAt: request.telegram_sent_at || '',
    telegramError: request.telegram_error || '',
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  };
}

async function fetchApiGuestRequestsByType<T extends object>(type: ApiGuestRequest['type']): Promise<Array<Stored<T>>> {
  const requests = await fetchApiAdminGuestRequests();
  return sortNewest(
    requests
      .filter((request) => request.type === type)
      .map((request) => fromApiGuestRequest<T>(request))
  );
}

function subscribeToRemote<T>(
  readData: () => Promise<T[]>,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  if (typeof window === 'undefined') {
    onData([]);
    return () => undefined;
  }

  let disposed = false;

  const emit = () => {
    readData()
      .then((items) => {
        if (!disposed) {
          onData(items);
        }
      })
      .catch((error) => {
        if (!disposed) {
          onError?.(error instanceof Error ? error : new Error('Unable to read remote data.'));
        }
      });
  };

  emit();
  const intervalId = window.setInterval(emit, 10000);

  return () => {
    disposed = true;
    window.clearInterval(intervalId);
  };
}

function userIdFromEmail(email: string) {
  return email.trim().toLowerCase().replace(/\//g, '_');
}

function resolveUserDocId(email: string, uid?: string | null) {
  return uid || userIdFromEmail(email);
}

function subscribeToCollection<T>(
  name: CollectionName,
  readData: () => T[],
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  if (!canUseStorage()) {
    onData([]);
    return () => undefined;
  }

  const emit = () => {
    try {
      onData(readData());
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unable to read local data.'));
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === collectionKey(name)) {
      emit();
    }
  };
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent).detail === name) {
      emit();
    }
  };

  emit();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(DATA_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(DATA_EVENT, handleLocalChange);
  };
}

export async function fetchTours(): Promise<Tour[]> {
  if (apiEnabled) {
    const apiTours = await fetchApiTours();
    if (apiTours.length > 0) {
      return apiTours;
    }
  }

  const localTours = readCollection<Tour>('tours');
  return localTours.length > 0
    ? localTours.sort((a, b) => Number(a.id) - Number(b.id))
    : fallbackTours;
}

export async function createTour(tour: Tour) {
  if (apiEnabled) {
    await createApiTour(tour);
    return;
  }

  const tours = readCollection<Tour>('tours');
  const withoutExisting = tours.filter((item) => item.id !== tour.id);
  writeCollection('tours', [...withoutExisting, tour]);
}

export async function updateTour(tourId: number, updates: Partial<Tour>) {
  if (apiEnabled) {
    await updateApiTour(tourId, updates);
    return;
  }

  const tours = readCollection<Tour>('tours');
  writeCollection(
    'tours',
    tours.map((tour) => (tour.id === tourId ? { ...tour, ...updates } : tour))
  );
}

export async function deleteTour(tourId: number) {
  if (apiEnabled) {
    await deleteApiTour(tourId);
    return;
  }

  writeCollection(
    'tours',
    readCollection<Tour>('tours').filter((tour) => tour.id !== tourId)
  );
}

export async function fetchSights(): Promise<Sight[]> {
  if (apiEnabled) {
    return (await fetchApiSights()).sort((a, b) => a.name.localeCompare(b.name));
  }

  return readCollection<Sight>('sights').sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchAdminSights(): Promise<Sight[]> {
  if (apiEnabled) {
    return (await fetchApiAdminSights()).sort((a, b) => a.name.localeCompare(b.name));
  }

  return fetchSights();
}

export async function createSight(sight: Omit<Sight, 'id'>) {
  if (apiEnabled) {
    await createApiSight(sight);
    return;
  }

  const entry: Stored<Sight> = { ...sight, id: createId(), createdAt: now() };
  writeCollection('sights', [entry, ...readCollection<Stored<Sight>>('sights')]);
}

export async function updateSight(sightId: string, updates: Partial<Sight>) {
  if (apiEnabled) {
    await updateApiSight(sightId, updates);
    return;
  }

  const items = readCollection<Stored<Sight>>('sights');
  writeCollection(
    'sights',
    items.map((item) => (item.id === sightId ? { ...item, ...updates, updatedAt: now() } : item))
  );
}

export async function deleteSight(sightId: string) {
  if (apiEnabled) {
    await deleteApiSight(sightId);
    return;
  }

  writeCollection(
    'sights',
    readCollection<Sight>('sights').filter((sight) => sight.id !== sightId)
  );
}

export async function fetchBlogPosts(fallbackPosts: BlogPost[] = []): Promise<BlogPost[]> {
  if (apiEnabled) {
    return sortNewest(await fetchApiBlogPosts());
  }

  const localPosts = readCollection<Stored<BlogPost>>('blogPosts');
  return sortNewest(localPosts.length > 0 ? localPosts : fallbackPosts);
}

export async function fetchAdminBlogPosts(): Promise<BlogPost[]> {
  if (apiEnabled) {
    return sortNewest(await fetchApiAdminBlogPosts());
  }

  return fetchBlogPosts();
}

export async function createBlogPost(post: Omit<BlogPost, 'id'>) {
  if (apiEnabled) {
    await createApiBlogPost(post);
    return;
  }

  const entry: Stored<BlogPost> = { ...post, id: createId(), createdAt: now() };
  writeCollection('blogPosts', [entry, ...readCollection<Stored<BlogPost>>('blogPosts')]);
}

export async function updateBlogPost(postId: string, updates: Partial<BlogPost>) {
  if (apiEnabled) {
    await updateApiBlogPost(postId, updates);
    return;
  }

  const items = readCollection<Stored<BlogPost>>('blogPosts');
  writeCollection(
    'blogPosts',
    items.map((item) => (item.id === postId ? { ...item, ...updates, updatedAt: now() } : item))
  );
}

export async function deleteBlogPost(postId: string) {
  if (apiEnabled) {
    await deleteApiBlogPost(postId);
    return;
  }

  writeCollection(
    'blogPosts',
    readCollection<BlogPost>('blogPosts').filter((post) => post.id !== postId)
  );
}

export async function submitCustomTourRequest(data: CustomTourRequest) {
  if (apiEnabled) {
    await submitApiCustomTourRequest(data);
  }
  const entry: Stored<CustomTourRequest> = {
    ...data,
    id: createId(),
    createdAt: now(),
    status: 'pending',
  };
  writeCollection('customTourRequests', [entry, ...readCollection<Stored<CustomTourRequest>>('customTourRequests')]);
}

export async function fetchCustomTourRequests(): Promise<Array<CustomTourRequest & { id: string }>> {
  if (apiEnabled) {
    return fetchApiGuestRequestsByType<CustomTourRequest>('custom_tour_request');
  }

  return sortNewest(readCollection<Stored<CustomTourRequest>>('customTourRequests'));
}

export function subscribeCustomTourRequests(
  onData: (requests: Array<CustomTourRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  if (apiEnabled) {
    return subscribeToRemote(fetchCustomTourRequests, onData, onError);
  }

  return subscribeToCollection('customTourRequests', () => sortNewest(readCollection<Stored<CustomTourRequest>>('customTourRequests')), onData, onError);
}

export function subscribeCustomTourRequestsByUserId(
  userId: string,
  onData: (requests: Array<CustomTourRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'customTourRequests',
    () => sortNewest(readCollection<Stored<CustomTourRequest>>('customTourRequests').filter((request) => request.userId === userId)),
    onData,
    onError
  );
}

export async function updateCustomTourRequestStatus(requestId: string, status: string) {
  if (apiEnabled) {
    await updateApiAdminGuestRequestStatus(requestId, status);
    return;
  }

  const items = readCollection<Stored<CustomTourRequest>>('customTourRequests');
  writeCollection(
    'customTourRequests',
    items.map((item) => (item.id === requestId ? { ...item, status, updatedAt: now() } : item))
  );
}

export async function submitBookingRequest(data: BookingRequest) {
  if (apiEnabled) {
    await submitApiBookingRequest(data);
  }
  const entry: Stored<BookingRequest> = {
    ...data,
    id: createId(),
    createdAt: now(),
    status: 'pending',
  };
  writeCollection('bookings', [entry, ...readCollection<Stored<BookingRequest>>('bookings')]);

  if (data.email) {
    await upsertUserProfile({ name: data.name, email: data.email, role: 'buyer', uid: data.userId });
  }
}

export async function fetchBookings(): Promise<Array<BookingRequest & { id: string }>> {
  if (apiEnabled) {
    return fetchApiGuestRequestsByType<BookingRequest>('booking');
  }

  return sortNewest(readCollection<Stored<BookingRequest>>('bookings'));
}

export async function fetchBookingsByEmail(email: string): Promise<Array<BookingRequest & { id: string }>> {
  const normalized = email.trim().toLowerCase();
  return sortNewest(
    readCollection<Stored<BookingRequest>>('bookings').filter((booking) => booking.email.trim().toLowerCase() === normalized)
  );
}

export async function fetchBookingsByUserId(userId: string): Promise<Array<BookingRequest & { id: string }>> {
  if (apiEnabled) {
    const requests = await fetchApiUserBookings();
    return sortNewest(requests.map((request) => fromApiGuestRequest<BookingRequest>(request)));
  }
  return sortNewest(readCollection<Stored<BookingRequest>>('bookings').filter((booking) => booking.userId === userId));
}

export function subscribeBookings(
  onData: (bookings: Array<BookingRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  if (apiEnabled) {
    return subscribeToRemote(fetchBookings, onData, onError);
  }

  return subscribeToCollection('bookings', () => sortNewest(readCollection<Stored<BookingRequest>>('bookings')), onData, onError);
}

export function subscribeBookingsByUserId(
  userId: string,
  onData: (bookings: Array<BookingRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  if (apiEnabled) {
    return subscribeToRemote(() => fetchBookingsByUserId(userId), onData, onError);
  }

  return subscribeToCollection(
    'bookings',
    () => sortNewest(readCollection<Stored<BookingRequest>>('bookings').filter((booking) => booking.userId === userId)),
    onData,
    onError
  );
}

export async function updateBookingStatus(bookingId: string, status: string) {
  if (apiEnabled) {
    await updateApiAdminGuestRequestStatus(bookingId, status);
    return;
  }

  const items = readCollection<Stored<BookingRequest>>('bookings');
  writeCollection(
    'bookings',
    items.map((item) => (item.id === bookingId ? { ...item, status, updatedAt: now() } : item))
  );
}

export async function submitFeedback(data: Omit<FeedbackEntry, 'id'>) {
  if (apiEnabled) {
    await createApiFeedback(data);
    return;
  }
  const entry: Stored<FeedbackEntry> = { ...data, id: createId(), createdAt: now() };
  writeCollection('feedback', [entry, ...readCollection<Stored<FeedbackEntry>>('feedback')]);
}

export async function fetchFeedbackEntries(): Promise<FeedbackEntry[]> {
  if (apiEnabled) {
    return sortNewest(await fetchApiAdminFeedback());
  }
  return sortNewest(readCollection<Stored<FeedbackEntry>>('feedback'));
}

export function subscribeFeedbackEntries(
  onData: (entries: FeedbackEntry[]) => void,
  onError?: (error: Error) => void
) {
  if (apiEnabled) {
    return subscribeToRemote(fetchFeedbackEntries, onData, onError);
  }
  return subscribeToCollection('feedback', () => sortNewest(readCollection<Stored<FeedbackEntry>>('feedback')), onData, onError);
}

export async function updateFeedbackResponse(
  feedbackId: string,
  adminResponse: string,
  isPublished?: boolean
) {
  if (apiEnabled) {
    await updateApiAdminFeedback(feedbackId, { adminResponse, isPublished });
    return;
  }
  const items = readCollection<Stored<FeedbackEntry>>('feedback');
  writeCollection(
    'feedback',
    items.map((item) =>
      item.id === feedbackId
        ? { ...item, adminResponse, isPublished: isPublished ?? item.isPublished, updatedAt: now() }
        : item
    )
  );
}

export async function fetchUsers(): Promise<UserRecord[]> {
  if (apiEnabled) {
    return (await fetchApiAdminUsers()).sort((a, b) =>
      String(a.email || '').localeCompare(String(b.email || ''))
    );
  }
  return readCollection<UserRecord>('users').sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
}

export async function fetchUserProfileByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  return readCollection<UserRecord>('users').find((user) => user.email?.trim().toLowerCase() === normalized) || null;
}

export async function fetchUserProfileById(userId: string): Promise<UserRecord | null> {
  return readCollection<UserRecord>('users').find((user) => user.id === userId) || null;
}

export async function upsertUserProfile(data: {
  name?: string;
  email: string;
  role?: string;
  uid?: string | null;
}) {
  const users = readCollection<Stored<UserRecord>>('users');
  const userId = resolveUserDocId(data.email, data.uid);
  const existing = users.find((user) => user.id === userId || user.email === data.email);
  const next: Stored<UserRecord> = {
    ...existing,
    id: existing?.id || userId,
    name: data.name ?? existing?.name,
    email: data.email,
    role: data.role ?? existing?.role ?? 'buyer',
    createdAt: existing?.createdAt || now(),
    updatedAt: now(),
  };
  writeCollection('users', [next, ...users.filter((user) => user.id !== next.id)]);
}

export async function updateUserRole(userId: string, role: string) {
  if (apiEnabled) {
    await updateApiAdminUserRole(userId, role);
    return;
  }
  const users = readCollection<Stored<UserRecord>>('users');
  writeCollection(
    'users',
    users.map((user) => (user.id === userId ? { ...user, role, updatedAt: now() } : user))
  );
}

export async function submitSellerTour(data: Omit<SellerSubmission, 'id' | 'status'>) {
  if (apiEnabled) {
    await createApiSellerSubmission(data);
    return;
  }
  const entry: Stored<SellerSubmission> = {
    ...data,
    id: createId(),
    status: 'pending',
    createdAt: now(),
  };
  writeCollection('sellerSubmissions', [entry, ...readCollection<Stored<SellerSubmission>>('sellerSubmissions')]);

  if (data.contactEmail) {
    await upsertUserProfile({
      name: data.contactName,
      email: data.contactEmail,
      role: 'seller',
      uid: data.ownerId,
    });
  }
}

export async function fetchSellerSubmissions(): Promise<SellerSubmission[]> {
  if (apiEnabled) {
    return sortNewest(await fetchApiAdminSellerSubmissions());
  }
  return sortNewest(readCollection<Stored<SellerSubmission>>('sellerSubmissions'));
}

export function subscribeSellerSubmissions(
  onData: (submissions: SellerSubmission[]) => void,
  onError?: (error: Error) => void
) {
  if (apiEnabled) {
    return subscribeToRemote(fetchSellerSubmissions, onData, onError);
  }
  return subscribeToCollection('sellerSubmissions', () => sortNewest(readCollection<Stored<SellerSubmission>>('sellerSubmissions')), onData, onError);
}

export async function fetchSellerSubmissionsByEmail(email: string): Promise<SellerSubmission[]> {
  const normalized = email.trim().toLowerCase();
  return sortNewest(
    readCollection<Stored<SellerSubmission>>('sellerSubmissions').filter(
      (submission) => submission.contactEmail.trim().toLowerCase() === normalized
    )
  );
}

export async function fetchSellerSubmissionsByOwnerId(userId: string): Promise<SellerSubmission[]> {
  if (apiEnabled) {
    return sortNewest(await fetchApiSellerSubmissions());
  }
  return sortNewest(readCollection<Stored<SellerSubmission>>('sellerSubmissions').filter((submission) => submission.ownerId === userId));
}

export function subscribeSellerSubmissionsByOwnerId(
  userId: string,
  onData: (submissions: SellerSubmission[]) => void,
  onError?: (error: Error) => void
) {
  if (apiEnabled) {
    return subscribeToRemote(() => fetchSellerSubmissionsByOwnerId(userId), onData, onError);
  }
  return subscribeToCollection(
    'sellerSubmissions',
    () => sortNewest(readCollection<Stored<SellerSubmission>>('sellerSubmissions').filter((submission) => submission.ownerId === userId)),
    onData,
    onError
  );
}

export async function updateSellerSubmissionStatus(submissionId: string, status: string) {
  if (apiEnabled) {
    await updateApiAdminSellerSubmissionStatus(submissionId, status);
    return;
  }
  const items = readCollection<Stored<SellerSubmission>>('sellerSubmissions');
  writeCollection(
    'sellerSubmissions',
    items.map((item) => (item.id === submissionId ? { ...item, status, updatedAt: now() } : item))
  );
}

export async function fetchContentSettings(): Promise<ContentSettings | null> {
  if (apiEnabled) {
    const settings = await fetchApiContentSettings();
    if (settings && Object.keys(settings).length > 0) {
      return settings;
    }
  }

  if (!canUseStorage()) {
    return null;
  }
  return safeParse<ContentSettings | null>(localStorage.getItem(CONTENT_SETTINGS_KEY), null);
}

export async function updateContentSettings(settings: ContentSettings) {
  if (apiEnabled) {
    await updateApiContentSettings(settings);
    return;
  }

  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(CONTENT_SETTINGS_KEY, JSON.stringify(settings));
}
