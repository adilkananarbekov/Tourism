import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type UserRecord, upsertUserProfile } from '../lib/dataStore';

type AppUser = {
  uid: string;
  email: string;
  displayName?: string;
};

type StoredAccount = AppUser & {
  password: string;
  role: 'buyer' | 'seller';
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller';
};

type AuthContextValue = {
  user: AppUser | null;
  profile: UserRecord | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  updateRole: (role: 'buyer' | 'seller') => Promise<void>;
};

const ACCOUNTS_KEY = 'go_kyrgyzstan_travel_accounts';
const SESSION_KEY = 'go_kyrgyzstan_travel_auth_session';
const AuthContext = createContext<AuthContextValue | null>(null);

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

function readAccounts() {
  const accounts = safeParse<StoredAccount[]>(localStorage.getItem(ACCOUNTS_KEY), []);
  return Array.isArray(accounts) ? accounts : [];
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function userIdFromEmail(email: string) {
  return email.trim().toLowerCase().replace(/\//g, '_');
}

function accountToProfile(account: StoredAccount): UserRecord {
  return {
    id: account.uid,
    name: account.displayName,
    email: account.email,
    role: account.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = safeParse<{ uid?: string } | null>(localStorage.getItem(SESSION_KEY), null);
    const account = session?.uid
      ? readAccounts().find((item) => item.uid === session.uid) || null
      : null;

    if (account) {
      setUser({
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
      });
      setProfile(accountToProfile(account));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts().find(
      (item) => item.email.trim().toLowerCase() === normalizedEmail && item.password === password
    );

    if (!account) {
      throw new Error('Invalid email or password.');
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: account.uid }));
    setUser({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
    });
    setProfile(accountToProfile(account));
  };

  const signUp = async ({ name, email, password, role }: SignUpPayload) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readAccounts();
    if (accounts.some((account) => account.email.trim().toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const account: StoredAccount = {
      uid: userIdFromEmail(email),
      email,
      password,
      displayName: name,
      role,
    };
    writeAccounts([account, ...accounts]);
    await upsertUserProfile({ name, email, role, uid: account.uid });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: account.uid }));
    setUser({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
    });
    setProfile(accountToProfile(account));
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateRole = async (role: 'buyer' | 'seller') => {
    if (!user) {
      throw new Error('No authenticated user.');
    }

    const accounts = readAccounts();
    const updatedAccounts = accounts.map((account) =>
      account.uid === user.uid ? { ...account, role } : account
    );
    writeAccounts(updatedAccounts);
    await upsertUserProfile({
      name: user.displayName,
      email: user.email,
      role,
      uid: user.uid,
    });
    setProfile((current) => ({
      id: user.uid,
      name: current?.name || user.displayName,
      email: user.email,
      role,
    }));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateRole,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
