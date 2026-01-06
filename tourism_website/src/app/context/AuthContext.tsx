import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { type UserRecord, upsertUserProfile } from '../lib/firestore';

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller';
};

type AuthContextValue = {
  user: User | null;
  profile: UserRecord | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  updateRole: (role: 'buyer' | 'seller') => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'users', nextUser.uid);
      profileUnsubscribe = onSnapshot(profileRef, async (snapshot) => {
        if (snapshot.exists()) {
          setProfile({ id: snapshot.id, ...snapshot.data() });
          return;
        }

        const fallbackProfile = {
          name: nextUser.displayName || '',
          email: nextUser.email || '',
          role: 'buyer',
        };
        await upsertUserProfile({ ...fallbackProfile, uid: nextUser.uid });
        setProfile({ id: nextUser.uid, ...fallbackProfile });
      });

      setLoading(false);
    });

    return () => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async ({ name, email, password, role }: SignUpPayload) => {
    if (!auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await upsertUserProfile({ name, email, role, uid: result.user.uid });
  };

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    await firebaseSignOut(auth);
  };

  const updateRole = async (role: 'buyer' | 'seller') => {
    if (!auth || !auth.currentUser) {
      throw new Error('No authenticated user.');
    }
    const email = auth.currentUser.email || profile?.email || '';
    if (!email) {
      throw new Error('Email address is required to update role.');
    }
    await upsertUserProfile({ email, role, uid: auth.currentUser.uid });
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
