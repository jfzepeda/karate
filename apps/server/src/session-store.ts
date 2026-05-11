import type { SessionInfo, Role } from "@karate/core";

export type { SessionInfo };

export class SessionStore {
  private sessions = new Map<string, SessionInfo>();

  add(info: SessionInfo): void {
    this.sessions.set(info.jti, info);
  }

  revoke(jti: string): boolean {
    const s = this.sessions.get(jti);
    if (!s) return false;
    s.revoked = true;
    return true;
  }

  isRevoked(jti: string): boolean {
    const s = this.sessions.get(jti);
    if (!s) return false;
    return s.revoked;
  }

  listActive(): SessionInfo[] {
    const now = Date.now();
    return Array.from(this.sessions.values())
      .filter((s) => !s.revoked && (s.expiresAt === 0 || s.expiresAt > now))
      .sort((a, b) => b.issuedAt - a.issuedAt);
  }
}
