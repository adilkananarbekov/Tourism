import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../app/lib/firebase';
import { upsertUserProfile } from '../app/lib/firestore';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
const ADMIN_SESSION_KEY = 'tourism-admin-session';

export async function authenticateAdmin(username: string, password: string) {
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return false;
  }

  localStorage.setItem(ADMIN_SESSION_KEY, 'true');

  if (auth && ADMIN_EMAIL) {
    const result = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    await upsertUserProfile({
      name: 'Admin',
      email: ADMIN_EMAIL,
      role: 'admin',
      uid: result.user.uid,
    });
  }

  return true;
}

export function isAdminAuthenticated() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export async function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  if (auth) {
    await firebaseSignOut(auth);
  }
}
