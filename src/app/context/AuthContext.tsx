import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type UserRecord, upsertUserProfile } from '../lib/dataStore';
import {
  apiEnabled,
  clearApiUserSession,
  fetchApiCurrentUser,
  hasApiUserSession,
  signInApiUser,
  signUpApiUser,
  updateApiCurrentUser,
} from '../lib/api';
import { clearLegacySensitiveLocalData } from '../lib/localStorage';

type AppUser = {
  uid: string;
  email: string;
  displayName?: string;
};

type StoredAccount = AppUser & {
  passwordHash: string;
  passwordSalt: string;
  role: 'buyer' | 'seller';
};

type LegacyStoredAccount = AppUser & {
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
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

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readLegacyAccounts() {
  const accounts = safeParse<LegacyStoredAccount[]>(localStorage.getItem(ACCOUNTS_KEY), []);
  return Array.isArray(accounts)
    ? accounts.filter((account) => account && typeof account === 'object')
    : [];
}

function isAccountRole(role: unknown): role is StoredAccount['role'] {
  return role === 'buyer' || role === 'seller';
}

function removeMigratedLegacyAccount(email: string, uid?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readLegacyAccounts();
  const remaining = accounts.filter((account) => {
    const sameUid = Boolean(uid && account.uid === uid);
    const sameEmail = account.email?.trim().toLowerCase() === normalizedEmail;
    return !sameUid && !sameEmail;
  });

  if (remaining.length > 0) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(remaining));
  } else {
    localStorage.removeItem(ACCOUNTS_KEY);
  }

  const session = safeParse<{ uid?: string } | null>(localStorage.getItem(SESSION_KEY), null);
  if (session?.uid && (accounts.length === 0 || session.uid === uid || accounts.some(
    (account) => account.uid === session.uid && account.email?.trim().toLowerCase() === normalizedEmail
  ))) {
    localStorage.removeItem(SESSION_KEY);
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hashPassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 120_000 },
    key,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function passwordRecord(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    passwordHash: await hashPassword(password, salt),
    passwordSalt: bytesToBase64(salt),
  };
}

async function readAccounts() {
  const raw = readLegacyAccounts();

  const accounts: StoredAccount[] = [];
  let changed = false;
  for (const account of raw) {
    if (!account.uid || !account.email || !isAccountRole(account.role)) {
      changed = true;
      continue;
    }
    if (account.passwordHash && account.passwordSalt) {
      accounts.push({
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        passwordHash: account.passwordHash,
        passwordSalt: account.passwordSalt,
      });
      if (account.password) {
        changed = true;
      }
      continue;
    }
    if (account.password) {
      accounts.push({
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        ...(await passwordRecord(account.password)),
      });
    }
    changed = true;
  }

  if (changed) {
    writeAccounts(accounts);
  }
  return accounts;
}

async function passwordMatches(account: StoredAccount, password: string) {
  return (await hashPassword(password, base64ToBytes(account.passwordSalt))) === account.passwordHash;
}

async function legacyPasswordMatches(account: LegacyStoredAccount, password: string) {
  if (typeof account.password === 'string') {
    return account.password === password;
  }
  if (
    account.passwordHash &&
    account.passwordSalt &&
    account.uid &&
    account.email &&
    isAccountRole(account.role)
  ) {
    return passwordMatches({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      passwordHash: account.passwordHash,
      passwordSalt: account.passwordSalt,
    }, password);
  }
  return false;
}

function activePlaintextLegacyAccount() {
  const session = safeParse<{ uid?: string } | null>(localStorage.getItem(SESSION_KEY), null);
  if (!session?.uid) {
    return null;
  }
  return readLegacyAccounts().find((account) => (
    account.uid === session.uid &&
    Boolean(account.email) &&
    isAccountRole(account.role) &&
    typeof account.password === 'string' &&
    account.password.length >= 8
  )) || null;
}

async function migratePlaintextLegacyAccount(account: LegacyStoredAccount) {
  const email = account.email || '';
  const password = account.password || '';
  try {
    return await signInApiUser(email, password);
  } catch {
    return signUpApiUser({
      name: account.displayName || email,
      email,
      password,
      role: account.role === 'seller' ? 'seller' : 'buyer',
    });
  }
}

async function migrateLegacyAccountWithPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readLegacyAccounts().find(
    (item) => item.email?.trim().toLowerCase() === normalizedEmail && isAccountRole(item.role)
  );
  if (!account || !(await legacyPasswordMatches(account, password))) {
    return null;
  }

  const remoteProfile = await signUpApiUser({
    name: account.displayName || account.email || email,
    email: account.email || email,
    password,
    role: account.role === 'seller' ? 'seller' : 'buyer',
  });
  removeMigratedLegacyAccount(remoteProfile.email || email, account.uid);
  clearLegacySensitiveLocalData();
  return remoteProfile;
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

function profileToUser(profile: UserRecord): AppUser {
  return {
    uid: profile.id,
    email: profile.email || '',
    displayName: profile.name,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (apiEnabled) {
        clearLegacySensitiveLocalData();
        let remoteProfile: UserRecord | null = null;
        try {
          if (hasApiUserSession()) {
            try {
              remoteProfile = await fetchApiCurrentUser();
            } catch {
              clearApiUserSession();
            }
          }

          if (!remoteProfile) {
            const legacyAccount = activePlaintextLegacyAccount();
            if (legacyAccount) {
              try {
                remoteProfile = await migratePlaintextLegacyAccount(legacyAccount);
              } catch {
                // Preserve the local account. It can be migrated after the user
                // explicitly enters its password when the API is reachable.
              }
            }
          }

          if (remoteProfile) {
            removeMigratedLegacyAccount(remoteProfile.email || '', remoteProfile.id);
            clearLegacySensitiveLocalData();
            if (active) {
              setUser(profileToUser(remoteProfile));
              setProfile(remoteProfile);
            }
          }
        } finally {
          if (!remoteProfile) {
            // Replace any remaining readable fallback passwords with hashes.
            // The accounts stay available for explicit one-time migration.
            await readAccounts().catch(() => undefined);
          }
          if (active) {
            setLoading(false);
          }
        }
        return;
      }

      const session = safeParse<{ uid?: string } | null>(localStorage.getItem(SESSION_KEY), null);
      const accounts = await readAccounts();
      const account = session?.uid
        ? accounts.find((item) => item.uid === session.uid) || null
        : null;
      if (account && active) {
        setUser({
          uid: account.uid,
          email: account.email,
          displayName: account.displayName,
        });
        setProfile(accountToProfile(account));
      }
      if (active) {
        setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (apiEnabled) {
      let remoteProfile: UserRecord;
      try {
        remoteProfile = await signInApiUser(email, password);
        const matchingLegacyAccount = readLegacyAccounts().find(
          (account) => account.email?.trim().toLowerCase() === email.trim().toLowerCase()
        );
        removeMigratedLegacyAccount(remoteProfile.email || email, matchingLegacyAccount?.uid);
        clearLegacySensitiveLocalData();
      } catch (apiError) {
        const migrated = await migrateLegacyAccountWithPassword(email, password).catch(() => null);
        if (!migrated) {
          throw apiError;
        }
        remoteProfile = migrated;
      }
      setUser(profileToUser(remoteProfile));
      setProfile(remoteProfile);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = await readAccounts();
    const account = accounts.find((item) => item.email.trim().toLowerCase() === normalizedEmail);

    if (!account || !(await passwordMatches(account, password))) {
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
    if (apiEnabled) {
      const remoteProfile = await signUpApiUser({ name, email, password, role });
      const matchingLegacyAccount = readLegacyAccounts().find(
        (account) => account.email?.trim().toLowerCase() === email.trim().toLowerCase()
      );
      removeMigratedLegacyAccount(remoteProfile.email || email, matchingLegacyAccount?.uid);
      clearLegacySensitiveLocalData();
      setUser(profileToUser(remoteProfile));
      setProfile(remoteProfile);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = await readAccounts();
    if (accounts.some((account) => account.email.trim().toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const account: StoredAccount = {
      uid: userIdFromEmail(email),
      email,
      displayName: name,
      role,
      ...(await passwordRecord(password)),
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
    clearApiUserSession();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateRole = async (role: 'buyer' | 'seller') => {
    if (!user) {
      throw new Error('No authenticated user.');
    }

    if (apiEnabled) {
      const remoteProfile = await updateApiCurrentUser({
        name: profile?.name || user.displayName || user.email,
        role,
      });
      setUser(profileToUser(remoteProfile));
      setProfile(remoteProfile);
      return;
    }

    const accounts = await readAccounts();
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
