import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/infrastructure/firebase/client';
import type { UserProfile } from '@/domain/entities/UserProfile';

type AuthContextValue = {
  firebaseReady: boolean;
  currentUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    // Capture the guarded instances before entering the auth callback. This keeps
    // the nullable Firebase exports narrowed for asynchronous work.
    const firebaseAuth = auth;
    const firestore = db;
    if (!firebaseAuth || !firestore) {
      setLoading(false);
      return;
    }

    let active = true;
    let revision = 0;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      const requestRevision = ++revision;
      if (!active) return;

      setLoading(true);
      setCurrentUser(user);
      setProfile(null);

      if (!user || user.isAnonymous) {
        setLoading(false);
        return;
      }

      void (async () => {
        try {
          const snapshot = await getDoc(doc(firestore, 'userProfiles', user.uid));
          if (active && requestRevision === revision) {
            setProfile(snapshot.exists() ? snapshot.data() as UserProfile : null);
          }
        } catch (error) {
          if (active && requestRevision === revision) {
            console.error('Unable to load user profile:', error);
          }
        } finally {
          if (active && requestRevision === revision) setLoading(false);
        }
      })();
    });

    return () => {
      active = false;
      revision += 1;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseReady: isFirebaseConfigured,
    currentUser,
    profile,
    loading,
    isOwner: Boolean(profile?.role === 'owner' && profile.isActive),
  }), [currentUser, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
