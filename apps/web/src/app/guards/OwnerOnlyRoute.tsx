import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';

export function OwnerOnlyRoute({ children }: { children: ReactNode }) {
  const { loading, currentUser, isOwner, firebaseReady } = useAuth();
  const location = useLocation();
  if (!firebaseReady) return <Navigate to="/owner/login" replace state={{ from: location }} />;
  if (loading) return <LoadingScreen label="Memeriksa akses owner…" />;
  if (!currentUser || currentUser.isAnonymous || !isOwner) {
    return <Navigate to="/owner/login" replace state={{ from: location }} />;
  }
  return children;
}
