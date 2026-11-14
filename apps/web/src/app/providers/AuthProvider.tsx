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
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      setProfile(null);
      if (!user || user.isAnonymous) {
        setLoading(false);
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, 'userProfiles', user.uid));
        if (snapshot.exists()) setProfile(snapshot.data() as UserProfile);
      } catch (error) {
        console.error('Unable to load user profile:', error);
      } finally {
        setLoading(false);
      }
    });
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
