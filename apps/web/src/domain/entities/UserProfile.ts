export type UserRole = 'owner';
export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: unknown;
};
