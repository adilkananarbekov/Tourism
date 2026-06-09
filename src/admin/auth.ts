import { upsertUserProfile } from '../app/lib/dataStore';

const ADMIN_TOKEN_KEY = 'go-kyrgyzstan-travel-admin-token';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

type AdminLoginResponse = {
  token: string;
  user: {
    username: string;
    email: string;
    role: string;
  };
};

function apiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function decodeTokenExpiry(token: string) {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = atob(padded);
  const parsed = JSON.parse(decoded) as { exp?: unknown };

  return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
}

function isTokenExpired(token: string) {
  try {
    const expiry = decodeTokenExpiry(token);
    return Boolean(expiry && Date.now() >= expiry);
  } catch {
    return true;
  }
}

export async function authenticateAdmin(username: string, password: string) {
  if (!apiBaseUrl) {
    return false;
  }

  try {
    const response = await fetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json().catch(() => null)) as AdminLoginResponse | null;
    if (!result?.token || !result?.user?.email) {
      return false;
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
    await upsertUserProfile({
      name: result.user.username || 'Admin',
      email: result.user.email,
      role: 'admin',
      uid: 'admin',
    });

    return true;
  } catch {
    return false;
  }
}

export function isAdminAuthenticated() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    return false;
  }

  return true;
}

export async function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
