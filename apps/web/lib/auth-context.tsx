"use client";

/**
 * Auth context for the karate web app.
 *
 * Lifecycle:
 *   1. On mount, load the cached session (token + expiry + user) from localStorage.
 *   2. If a token is present and not yet expired, mark the user signed-in immediately.
 *   3. In the background, attempt a renewal whenever the token age exceeds the
 *      renewal threshold (20h by default). Success → swap in the new token.
 *      Failure due to network → keep using the cached token until it expires.
 *      Failure due to revocation/expired account → log out.
 *   4. If the cached token is expired and the server is unreachable, surface a
 *      "lock" state so the UI can show the renewal screen instead of the app.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AuthSession, AuthUser, Role } from "@karate/core";
import { ApiError, apiLogin, apiMe, apiRenew } from "./api-client";

const STORAGE_TOKEN = "karate.auth.token";
const STORAGE_EXPIRY = "karate.auth.expiresAt";
const STORAGE_USER = "karate.auth.user";
const STORAGE_USERNAME = "karate.auth.username";
const STORAGE_PASSWORD = "karate.auth.password"; // see SECURITY note at bottom of file
const STORAGE_PUBLIC_KEY = "karate.auth.publicKey";

export type AuthStatus =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "authed"; session: AuthSession }
  | { kind: "locked"; reason: string };

interface AuthApi {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login(username: string, password: string): Promise<AuthUser>;
  logout(): void;
  retryRenewal(): Promise<void>;
  hasRole(role: Role | Role[]): boolean;
}

const AuthContext = createContext<AuthApi | null>(null);

const RENEWAL_THRESHOLD_SECONDS = 20 * 60 * 60;

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function readString(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function readUser(): AuthUser | null {
  const raw = readString(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession & { publicKey?: string }): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_TOKEN, session.token);
  window.localStorage.setItem(STORAGE_EXPIRY, String(session.expiresAt));
  window.localStorage.setItem(STORAGE_USER, JSON.stringify(session.user));
  if (session.publicKey) {
    window.localStorage.setItem(STORAGE_PUBLIC_KEY, session.publicKey);
  }
}

function persistCredentials(username: string, password: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_USERNAME, username);
  window.localStorage.setItem(STORAGE_PASSWORD, password);
}

function clearAll(): void {
  if (typeof window === "undefined") return;
  for (const k of [
    STORAGE_TOKEN,
    STORAGE_EXPIRY,
    STORAGE_USER,
    STORAGE_USERNAME,
    STORAGE_PASSWORD,
  ]) {
    window.localStorage.removeItem(k);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>({ kind: "loading" });
  const renewing = useRef(false);

  const setAuthed = useCallback((session: AuthSession) => {
    setStatus({ kind: "authed", session });
  }, []);

  const handleAuthError = useCallback((reason: string) => {
    clearAll();
    setStatus({ kind: "locked", reason });
  }, []);

  const tryRenew = useCallback(async (): Promise<void> => {
    if (renewing.current) return;
    renewing.current = true;
    try {
      const username = readString(STORAGE_USERNAME);
      const password = readString(STORAGE_PASSWORD);
      if (!username || !password) {
        clearAll();
        setStatus({ kind: "anonymous" });
        return;
      }
      const session = await apiRenew(username, password);
      persistSession(session);
      setAuthed(session);
    } catch (e) {
      const err = e as ApiError;
      if (err && err.status === 401) {
        // Permanent rejection — account revoked or password changed.
        clearAll();
        setStatus({ kind: "locked", reason: err.code || "account_revoked" });
        return;
      }
      // Network failure — fall back to whatever we have cached.
      const expiresAt = readNumber(STORAGE_EXPIRY);
      const user = readUser();
      const token = readString(STORAGE_TOKEN);
      if (token && user && expiresAt && expiresAt > Date.now()) {
        setAuthed({ token, expiresAt, user });
      } else {
        setStatus({ kind: "locked", reason: "offline" });
      }
    } finally {
      renewing.current = false;
    }
  }, [setAuthed]);

  // Bootstrap on mount.
  useEffect(() => {
    const token = readString(STORAGE_TOKEN);
    const expiresAt = readNumber(STORAGE_EXPIRY);
    const user = readUser();
    const now = Date.now();

    if (!token || !expiresAt || !user) {
      setStatus({ kind: "anonymous" });
      return;
    }
    if (expiresAt <= now) {
      // Cached token has fully expired; attempt a fresh renewal.
      void tryRenew();
      return;
    }
    // Token is still valid. Mark authed immediately.
    setAuthed({ token, expiresAt, user });
    // If we're past the renewal threshold, refresh in the background.
    const ageSeconds = Math.floor((now - (expiresAt - 24 * 60 * 60 * 1000)) / 1000);
    if (ageSeconds > RENEWAL_THRESHOLD_SECONDS) {
      void tryRenew();
    }
  }, [tryRenew, setAuthed]);

  // Watch for the access token expiring while the app is open.
  useEffect(() => {
    if (status.kind !== "authed") return;
    const msUntilExpiry = status.session.expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      void tryRenew();
      return;
    }
    const renewIn = Math.max(60_000, msUntilExpiry - 5 * 60 * 1000);
    const t = window.setTimeout(() => void tryRenew(), renewIn);
    return () => window.clearTimeout(t);
  }, [status, tryRenew]);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthUser> => {
      const session = await apiLogin(username, password);
      persistSession(session);
      persistCredentials(username, password);
      setAuthed(session);
      return session.user;
    },
    [setAuthed]
  );

  const logout = useCallback(() => {
    clearAll();
    setStatus({ kind: "anonymous" });
  }, []);

  const api: AuthApi = useMemo(() => {
    const session = status.kind === "authed" ? status.session : null;
    return {
      status,
      user: session ? session.user : null,
      token: session ? session.token : null,
      login,
      logout,
      retryRenewal: tryRenew,
      hasRole(role) {
        if (!session) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(session.user.role);
      },
    };
  }, [status, login, logout, tryRenew]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// SECURITY note: storing the cleartext password in localStorage is a deliberate
// trade-off chosen to satisfy the "send credentials on renew" spec while keeping
// the desktop app fully offline-capable. In Electron we plan to migrate this to
// Electron's `safeStorage` API (OS-encrypted) — see apps/desktop/preload.ts.
// Until then, the app should only be installed on machines the operator trusts.
