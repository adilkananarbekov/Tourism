import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Tour } from '../components/tour-data';

export interface CustomTourRequest {
  groupSize: number;
  startDate: string;
  endDate: string;
  startLocation: string;
  endLocation: string;
  sights: string[];
  activities: string[];
  pace: string;
  accommodation: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  specialRequests: string;
  userId?: string;
  status?: string;
}

export interface BookingRequest {
  tourId: number;
  tourTitle: string;
  name: string;
  email: string;
  phone: string;
  participants: number;
  startDate: string;
  endDate: string;
  notes: string;
  pricePerPerson: string;
  totalPrice: string;
  userId?: string;
  status?: string;
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
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
}

export interface FeedbackEntry {
  id: string;
  name: string;
  rating: number;
  comments: string;
  adminResponse?: string;
}

export interface UserRecord {
  id: string;
  name?: string;
  email?: string;
  role?: string;
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
}

export interface ContentSettings {
  heroHeadline?: string;
  heroSubheadline?: string;
  contactEmail?: string;
  contactPhone?: string;
}

function requireFirestore() {
  if (!db) {
    throw new Error('Backend is not configured. Add the required VITE_ variables.');
  }
  return db;
}

function normalizeDoc<T extends Record<string, unknown>>(docId: string, data: DocumentData): T {
  return {
    id: docId,
    ...data,
  } as T;
}

function normalizeTour(docId: string, data: DocumentData): Tour {
  const raw = data as Tour;
  const id = typeof raw.id === 'number' ? raw.id : Number(docId);
  return {
    ...raw,
    id,
  };
}

function userIdFromEmail(email: string) {
  return email.trim().toLowerCase().replace(/\//g, '_');
}

function resolveUserDocId(email: string, uid?: string | null) {
  if (uid) {
    return uid;
  }
  return userIdFromEmail(email);
}

export async function fetchTours(): Promise<Tour[]> {
  const firestore = requireFirestore();
  const toursRef = collection(firestore, 'tours');
  const snapshot = await getDocs(query(toursRef, orderBy('id')));
  return snapshot.docs.map((docSnap) => normalizeTour(docSnap.id, docSnap.data()));
}

export async function createTour(tour: Tour) {
  const firestore = requireFirestore();
  const docRef = doc(collection(firestore, 'tours'), String(tour.id));
  await setDoc(docRef, {
    ...tour,
    createdAt: serverTimestamp(),
  });
}

export async function updateTour(tourId: number, updates: Partial<Tour>) {
  const firestore = requireFirestore();
  const docRef = doc(collection(firestore, 'tours'), String(tourId));
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTour(tourId: number) {
  const firestore = requireFirestore();
  await deleteDoc(doc(collection(firestore, 'tours'), String(tourId)));
}

export async function fetchSights(): Promise<Sight[]> {
  const firestore = requireFirestore();
  const sightsRef = collection(firestore, 'sights');
  const snapshot = await getDocs(query(sightsRef, orderBy('name')));
  return snapshot.docs.map((docSnap) => normalizeDoc<Sight>(docSnap.id, docSnap.data()));
}

export async function createSight(sight: Omit<Sight, 'id'>) {
  const firestore = requireFirestore();
  await addDoc(collection(firestore, 'sights'), {
    ...sight,
    createdAt: serverTimestamp(),
  });
}

export async function updateSight(sightId: string, updates: Partial<Sight>) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'sights'), sightId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSight(sightId: string) {
  const firestore = requireFirestore();
  await deleteDoc(doc(collection(firestore, 'sights'), sightId));
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const firestore = requireFirestore();
  const postsRef = collection(firestore, 'blogPosts');
  const snapshot = await getDocs(query(postsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => normalizeDoc<BlogPost>(docSnap.id, docSnap.data()));
}

export async function createBlogPost(post: Omit<BlogPost, 'id'>) {
  const firestore = requireFirestore();
  await addDoc(collection(firestore, 'blogPosts'), {
    ...post,
    createdAt: serverTimestamp(),
  });
}

export async function updateBlogPost(postId: string, updates: Partial<BlogPost>) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'blogPosts'), postId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBlogPost(postId: string) {
  const firestore = requireFirestore();
  await deleteDoc(doc(collection(firestore, 'blogPosts'), postId));
}

export async function submitCustomTourRequest(data: CustomTourRequest) {
  const firestore = requireFirestore();
  if (!data.userId) {
    throw new Error('Sign in required to submit custom tour requests.');
  }
  await addDoc(collection(firestore, 'customTourRequests'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'pending',
  });
}

export async function fetchCustomTourRequests(): Promise<Array<CustomTourRequest & { id: string }>> {
  const firestore = requireFirestore();
  const requestsRef = collection(firestore, 'customTourRequests');
  const snapshot = await getDocs(query(requestsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data()));
}

export function subscribeCustomTourRequests(
  onData: (requests: Array<CustomTourRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const requestsRef = collection(firestore, 'customTourRequests');
  const q = query(requestsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export function subscribeCustomTourRequestsByUserId(
  userId: string,
  onData: (requests: Array<CustomTourRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const requestsRef = collection(firestore, 'customTourRequests');
  const q = query(requestsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function updateCustomTourRequestStatus(requestId: string, status: string) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'customTourRequests'), requestId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function submitBookingRequest(data: BookingRequest) {
  const firestore = requireFirestore();
  if (!data.userId) {
    throw new Error('Sign in required to submit booking requests.');
  }
  await addDoc(collection(firestore, 'bookings'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'pending',
  });
  try {
    await upsertUserProfile({ name: data.name, email: data.email, role: 'buyer', uid: data.userId });
  } catch {
    // Profile sync is optional for booking submissions.
  }
}

export async function fetchBookings(): Promise<Array<BookingRequest & { id: string }>> {
  const firestore = requireFirestore();
  const bookingsRef = collection(firestore, 'bookings');
  const snapshot = await getDocs(query(bookingsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data()));
}

export async function fetchBookingsByEmail(email: string): Promise<Array<BookingRequest & { id: string }>> {
  const firestore = requireFirestore();
  const bookingsRef = collection(firestore, 'bookings');
  const snapshot = await getDocs(
    query(bookingsRef, where('email', '==', email), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data()));
}

export async function fetchBookingsByUserId(
  userId: string
): Promise<Array<BookingRequest & { id: string }>> {
  const firestore = requireFirestore();
  const bookingsRef = collection(firestore, 'bookings');
  const snapshot = await getDocs(
    query(bookingsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data()));
}

export function subscribeBookings(
  onData: (bookings: Array<BookingRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const bookingsRef = collection(firestore, 'bookings');
  const q = query(bookingsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export function subscribeBookingsByUserId(
  userId: string,
  onData: (bookings: Array<BookingRequest & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const bookingsRef = collection(firestore, 'bookings');
  const q = query(bookingsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'bookings'), bookingId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function submitFeedback(data: Omit<FeedbackEntry, 'id'>) {
  const firestore = requireFirestore();
  await addDoc(collection(firestore, 'feedback'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function fetchFeedbackEntries(): Promise<FeedbackEntry[]> {
  const firestore = requireFirestore();
  const feedbackRef = collection(firestore, 'feedback');
  const snapshot = await getDocs(query(feedbackRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => normalizeDoc<FeedbackEntry>(docSnap.id, docSnap.data()));
}

export function subscribeFeedbackEntries(
  onData: (entries: FeedbackEntry[]) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const feedbackRef = collection(firestore, 'feedback');
  const q = query(feedbackRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc<FeedbackEntry>(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function updateFeedbackResponse(feedbackId: string, adminResponse: string) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'feedback'), feedbackId), {
    adminResponse,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchUsers(): Promise<UserRecord[]> {
  const firestore = requireFirestore();
  const usersRef = collection(firestore, 'users');
  const snapshot = await getDocs(query(usersRef, orderBy('email')));
  return snapshot.docs.map((docSnap) => normalizeDoc<UserRecord>(docSnap.id, docSnap.data()));
}

export async function fetchUserProfileByEmail(email: string): Promise<UserRecord | null> {
  const firestore = requireFirestore();
  const snapshot = await getDoc(doc(collection(firestore, 'users'), userIdFromEmail(email)));
  if (!snapshot.exists()) {
    return null;
  }
  return normalizeDoc<UserRecord>(snapshot.id, snapshot.data());
}

export async function fetchUserProfileById(userId: string): Promise<UserRecord | null> {
  const firestore = requireFirestore();
  const snapshot = await getDoc(doc(collection(firestore, 'users'), userId));
  if (!snapshot.exists()) {
    return null;
  }
  return normalizeDoc<UserRecord>(snapshot.id, snapshot.data());
}

export async function upsertUserProfile(data: {
  name?: string;
  email: string;
  role?: string;
  uid?: string | null;
}) {
  const firestore = requireFirestore();
  const userId = resolveUserDocId(data.email, data.uid);
  await setDoc(
    doc(collection(firestore, 'users'), userId),
    {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateUserRole(userId: string, role: string) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'users'), userId), {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function submitSellerTour(data: Omit<SellerSubmission, 'id' | 'status'>) {
  const firestore = requireFirestore();
  if (!data.ownerId) {
    throw new Error('Sign in required to submit seller tours.');
  }
  await addDoc(collection(firestore, 'sellerSubmissions'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  try {
    await upsertUserProfile({
      name: data.contactName,
      email: data.contactEmail,
      role: 'seller',
      uid: data.ownerId,
    });
  } catch {
    // Profile sync is optional for seller submissions.
  }
}

export async function fetchSellerSubmissions(): Promise<SellerSubmission[]> {
  const firestore = requireFirestore();
  const submissionsRef = collection(firestore, 'sellerSubmissions');
  const snapshot = await getDocs(query(submissionsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => normalizeDoc<SellerSubmission>(docSnap.id, docSnap.data()));
}

export function subscribeSellerSubmissions(
  onData: (submissions: SellerSubmission[]) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const submissionsRef = collection(firestore, 'sellerSubmissions');
  const q = query(submissionsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc<SellerSubmission>(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function fetchSellerSubmissionsByEmail(email: string): Promise<SellerSubmission[]> {
  const firestore = requireFirestore();
  const submissionsRef = collection(firestore, 'sellerSubmissions');
  const snapshot = await getDocs(
    query(submissionsRef, where('contactEmail', '==', email), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnap) => normalizeDoc<SellerSubmission>(docSnap.id, docSnap.data()));
}

export async function fetchSellerSubmissionsByOwnerId(userId: string): Promise<SellerSubmission[]> {
  const firestore = requireFirestore();
  const submissionsRef = collection(firestore, 'sellerSubmissions');
  const snapshot = await getDocs(
    query(submissionsRef, where('ownerId', '==', userId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnap) => normalizeDoc<SellerSubmission>(docSnap.id, docSnap.data()));
}

export function subscribeSellerSubmissionsByOwnerId(
  userId: string,
  onData: (submissions: SellerSubmission[]) => void,
  onError?: (error: Error) => void
) {
  const firestore = requireFirestore();
  const submissionsRef = collection(firestore, 'sellerSubmissions');
  const q = query(submissionsRef, where('ownerId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDoc<SellerSubmission>(docSnap.id, docSnap.data())));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function updateSellerSubmissionStatus(submissionId: string, status: string) {
  const firestore = requireFirestore();
  await updateDoc(doc(collection(firestore, 'sellerSubmissions'), submissionId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchContentSettings(): Promise<ContentSettings | null> {
  const firestore = requireFirestore();
  const contentDoc = await getDoc(doc(collection(firestore, 'content'), 'site'));
  if (!contentDoc.exists()) {
    return null;
  }
  return contentDoc.data() as ContentSettings;
}

export async function updateContentSettings(settings: ContentSettings) {
  const firestore = requireFirestore();
  await setDoc(
    doc(collection(firestore, 'content'), 'site'),
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
