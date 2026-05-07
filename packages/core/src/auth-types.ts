// Client-facing auth types. Server defines the canonical shape; this mirrors it
// so consumers in the web app can stay typed without depending on the server package.

export type Role = "superadmin" | "referee";

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  expiresAt: number | null;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface AuthSession {
  token: string;
  expiresAt: number;
  user: AuthUser;
}
