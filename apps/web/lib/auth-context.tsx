"use client";

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
import { apiLogin, apiMe } from "./api-client";

const STORAGE_TOKEN = "karate.auth.token";
const STORAGE_EXPIRY = "karate.auth.expiresAt";
const STORAGE_ISSUED_AT = "karate.auth.issuedAt";
const STORAGE_USER = "karate.auth.user";

export type AuthStatus =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "authed"; session: AuthSession }
  | { kind: "locked"; reason: string };

interface AuthApi {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  isKiosk: boolean;
  login(code: string): Promise<AuthUser>;
  logout(): void;
  redeemCode(code: string): Promise<void>;
  hasRole(role: Role | Role[]): boolean;
}

const AuthContext = createContext<AuthApi | null>(null);

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

function persistSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_TOKEN, session.token);
  window.localStorage.setItem(STORAGE_EXPIRY, String(session.expiresAt));
  window.localStorage.setItem(STORAGE_ISSUED_AT, String(session.issuedAt ?? Date.now()));
  window.localStorage.setItem(STORAGE_USER, JSON.stringify(session.user));
}

function clearAll(): void {
  if (typeof window === "undefined") return;
  for (const k of [
    STORAGE_TOKEN,
    STORAGE_EXPIRY,
    STORAGE_ISSUED_AT,
    STORAGE_USER,
  ]) {
    window.localStorage.removeItem(k);
  }
}

// Suppress unused import warning — apiMe is kept for potential use
void apiMe;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>({ kind: "loading" });
  const isKiosk = useRef(false);

  const setAuthed = useCallback((session: AuthSession) => {
    setStatus({ kind: "authed", session });
  }, []);

  // Bootstrap on mount — fully synchronous, no network calls needed.
  useEffect(() => {
    const now = Date.now();

    // In Electron the kiosk session is injected by the preload (from main process)
    // so it's available synchronously with no fetch required.
    const kiosk = window.__KARATE__?.kioskSession ?? null;
    if (kiosk) {
      if (kiosk.expiresAt > now) {
        isKiosk.current = true;
        setAuthed({
          token: kiosk.token,
          issuedAt: kiosk.issuedAt,
          expiresAt: kiosk.expiresAt,
          user: { role: kiosk.user.role as import("@karate/core").Role },
        });
        return;
      }
      // Kiosk token already expired when the app opened.
      setStatus({ kind: "locked", reason: "kiosk_expired" });
      return;
    }

    // Normal browser / web flow — check localStorage.
    const token = readString(STORAGE_TOKEN);
    const expiresAt = readNumber(STORAGE_EXPIRY);
    const user = readUser();

    if (!token || expiresAt === null || !user) {
      setStatus({ kind: "anonymous" });
      return;
    }
    // expiresAt === 0 means superadmin (never expires)
    if (expiresAt !== 0 && expiresAt <= now) {
      clearAll();
      setStatus({ kind: user.role === "superadmin" ? "anonymous" : "locked", reason: "session_expired" });
      return;
    }
    setAuthed({ token, issuedAt: readNumber(STORAGE_ISSUED_AT) ?? now, expiresAt, user });
  }, [setAuthed]);

  // Watch for the access token expiring while the app is open.
  useEffect(() => {
    if (status.kind !== "authed") return;
    const { expiresAt } = status.session;
    if (expiresAt === 0) return; // superadmin — never expires
    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      clearAll();
      setStatus({ kind: isKiosk.current ? "locked" : "locked", reason: isKiosk.current ? "kiosk_expired" : "session_expired" });
      return;
    }
    const role = status.session.user.role;
    const t = window.setTimeout(() => {
      clearAll();
      if (isKiosk.current) setStatus({ kind: "locked", reason: "kiosk_expired" });
      else if (role === "superadmin") setStatus({ kind: "anonymous" });
      else setStatus({ kind: "locked", reason: "session_expired" });
    }, msUntilExpiry);
    return () => window.clearTimeout(t);
  }, [status]);

  const login = useCallback(
    async (code: string): Promise<AuthUser> => {
      const session = await apiLogin(code);
      persistSession(session);
      setAuthed(session);
      return session.user;
    },
    [setAuthed]
  );

  const logout = useCallback(() => {
    clearAll();
    setStatus({ kind: "anonymous" });
  }, []);

  const redeemCode = useCallback(async (code: string): Promise<void> => {
    await login(code);
  }, [login]);

  const api: AuthApi = useMemo(() => {
    const session = status.kind === "authed" ? status.session : null;
    return {
      status,
      user: session ? session.user : null,
      token: session ? session.token : null,
      isKiosk: isKiosk.current,
      login,
      logout,
      redeemCode,
      hasRole(role) {
        if (!session) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(session.user.role);
      },
    };
  }, [status, login, logout, redeemCode]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
