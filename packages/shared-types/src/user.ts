export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  avatarUrl: string | null;
  firebaseUid: string;
  role: UserRole;
  premiumUntil: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;
}
