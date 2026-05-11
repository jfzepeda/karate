// Client-facing auth types. Server defines the canonical shape; this mirrors it
// so consumers in the web app can stay typed without depending on the server package.

export type Role = "superadmin" | "referee";

export interface AuthUser {
  role: Role;
}

export interface AuthSession {
  token: string;
  issuedAt: number;
  expiresAt: number; // 0 = never (superadmin)
  user: AuthUser;
}

export interface SessionInfo {
  jti: string;
  role: Role;
  issuedAt: number;
  expiresAt: number; // 0 = never
  ip: string | null;
  revoked: boolean;
}

export interface KioskSession {
  token: string;
  issuedAt: number;
  expiresAt: number;
  user: AuthUser;
}
