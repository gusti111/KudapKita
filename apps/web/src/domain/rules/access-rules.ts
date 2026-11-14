import type { UserProfile } from '@/domain/entities/UserProfile';

export function canAccessOwnerWorkspace(profile: UserProfile | null): boolean {
  return profile?.role === 'owner' && profile.isActive === true;
}
