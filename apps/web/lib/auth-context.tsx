"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type {
  AuthUser, Role, LicenseState, LicensePublic, LicenseDegradedReason,
} from "@karate/core";
import { apiActivate, apiRenewToken } from "./api-client";

/**
 * License-aware auth context. Replaces the old username/password AuthProvider.
 *
 * In Electron: state is owned by the main process. The preload exposes
 * `window.__KARATE__.license` for read/activate/reset. The JWT is kept in
 * main process and copied into renderer memory only for the lifetime of an
 * API call.
 *
 * In browser-only (web dev): the renderer talks to /api/activate directly,
 * holds the JWT in memory, and runs its own renewal loop. The machine
 * fingerprint is a per-browser random salt (acceptable for dev).
 */

const TOKEN_KEY = "karate.session.jwt";       // sessionStorage — survives reloads only
const STATE_KEY = "karate.session.state";     // sessionStorage — for browser-only mode
const FP_KEY = "karate.browser.fp";

export type AuthStatus =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "authed"; session: { user: AuthUser; expiresAt: number; issuedAt: number; token: string }; license: LicensePublic; isGrace: boolean; graceRemainingMs: number }
  | { kind: "locked"; reason: LicenseDegradedReason };

interface AuthApi {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  isKiosk: boolean;
  machineFingerprint: string | null;
  graceRemainingMs: number;
  licenseState: LicenseState;
  login(code: string): Promise<AuthUser>;
  logout(): void;
  redeemCode(code: string): Promise<void>;
  retryRenewal(): Promise<void>;
  hasRole(role: Role | Role[]): boolean;
}

const AuthContext = createContext<AuthApi | null>(null);

function randHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  if (typeof crypto !== "undefined") crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getBrowserMachineFp(): string {
  if (typeof window === "undefined") return "";
  let fp = window.localStorage.getItem(FP_KEY);
  if (!fp) {
    fp = randHex(32);
    window.localStorage.setItem(FP_KEY, fp);
  }
  return fp;
}

function readSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

function persistSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(STATE_KEY);
}

function buildAuthedStatus(license: LicensePublic, token: string, isGrace: boolean, graceRemainingMs: number): AuthStatus {
  return {
    kind: "authed",
    session: {
      token,
      issuedAt: license.activatedAt,
      expiresAt: license.expiresAt,
      user: { role: license.role, features: license.features },
    },
    license,
    isGrace,
    graceRemainingMs,
  };
}

function statusFromState(state: LicenseState, token: string | null): AuthStatus {
  if (state.kind === "unlicensed") return { kind: "anonymous" };
  if (state.kind === "degraded") return { kind: "locked", reason: state.reason };
  if (state.kind === "active") {
    if (!token) return { kind: "loading" };
    return buildAuthedStatus(state.license, token, false, 0);
  }
  // grace
  if (!token) return { kind: "loading" };
  return buildAuthedStatus(state.license, token, true, state.graceRemainingMs);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [licenseState, setLicenseState] = useState<LicenseState>({ kind: "unlicensed" });
  const [token, setToken] = useState<string | null>(null);
  const [machineFp, setMachineFp] = useState<string | null>(null);
  const isKioskRef = useRef(false);
  const [status, setStatus] = useState<AuthStatus>({ kind: "loading" });

  // ------- Bootstrap -------
  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      // Kiosk session — same path as before.
      const kiosk = (typeof window !== "undefined" ? window.__KARATE__?.kioskSession : null);
      if (kiosk) {
        if (kiosk.expiresAt > Date.now()) {
          isKioskRef.current = true;
          setToken(kiosk.token);
          const fakeState: LicenseState = {
            kind: "active",
            license: {
              role: kiosk.user.role,
              features: kiosk.user.features ?? [],
              plan: kiosk.user.role,
              expiresAt: kiosk.expiresAt,
              activatedAt: kiosk.issuedAt,
              jti: "kiosk",
            },
          };
          setLicenseState(fakeState);
          return;
        }
      }

      // Electron flow — main process owns the state.
      const license = (typeof window !== "undefined" ? window.__KARATE__?.license : null);
      if (license) {
        const boot = await license.getBootstrap();
        if (!mounted) return;
        const state = (boot.state ?? { kind: "unlicensed" }) as LicenseState;
        setMachineFp(boot.machineFingerprint);
        setLicenseState(state);
        setToken(boot.token ?? null);
        license.onChange((envelope) => {
          setLicenseState((envelope?.state ?? { kind: "unlicensed" }) as LicenseState);
          setToken(envelope?.token ?? null);
        });
        return;
      }

      // Browser-only fallback.
      setMachineFp(getBrowserMachineFp());
      const cached = readSessionToken();
      if (cached) {
        try {
          const renewed = await apiRenewToken(cached, getBrowserMachineFp());
          persistSessionToken(renewed.token);
          if (!mounted) return;
          setToken(renewed.token);
          setLicenseState({
            kind: "active",
            license: {
              role: renewed.payload.role,
              features: renewed.payload.features,
              plan: renewed.payload.plan,
              expiresAt: renewed.payload.exp * 1000,
              activatedAt: renewed.payload.activated_at * 1000,
              jti: renewed.payload.jti,
            },
          });
        } catch {
          clearSessionToken();
          if (!mounted) return;
          setLicenseState({ kind: "unlicensed" });
        }
      } else {
        if (!mounted) return;
        setLicenseState({ kind: "unlicensed" });
      }
    }
    bootstrap();
    return () => { mounted = false; };
  }, []);

  // Recompute the renderer-facing status whenever inputs change.
  useEffect(() => {
    setStatus(statusFromState(licenseState, token));
  }, [licenseState, token]);

  // ------- Actions -------
  const login = useCallback(async (code: string): Promise<AuthUser> => {
    const license = (typeof window !== "undefined" ? window.__KARATE__?.license : null);
    if (license) {
      const r = await license.activateCode(code);
      if (!r.ok) throw new Error(r.error || "activation_failed");
      const state = (r.state ?? { kind: "unlicensed" }) as LicenseState;
      setLicenseState(state);
      setToken(r.token ?? null);
      if (state.kind === "active") {
        return { role: state.license.role, features: state.license.features };
      }
      throw new Error("activation_failed");
    }
    // Browser fallback.
    const fp = machineFp ?? getBrowserMachineFp();
    const r = await apiActivate(code, fp);
    persistSessionToken(r.token);
    setToken(r.token);
    const next: LicenseState = {
      kind: "active",
      license: {
        role: r.payload.role,
        features: r.payload.features,
        plan: r.payload.plan,
        expiresAt: r.payload.exp * 1000,
        activatedAt: r.payload.activated_at * 1000,
        jti: r.payload.jti,
      },
    };
    setLicenseState(next);
    return { role: r.payload.role, features: r.payload.features };
  }, [machineFp]);

  const retryRenewal = useCallback(async () => {
    const license = (typeof window !== "undefined" ? window.__KARATE__?.license : null);
    if (license) {
      const envelope = await license.retryRenewal();
      setLicenseState((envelope?.state ?? { kind: "unlicensed" }) as LicenseState);
      setToken(envelope?.token ?? null);
      return;
    }
    const cached = readSessionToken();
    if (!cached) return;
    try {
      const r = await apiRenewToken(cached, machineFp ?? getBrowserMachineFp());
      persistSessionToken(r.token);
      setToken(r.token);
      setLicenseState({
        kind: "active",
        license: {
          role: r.payload.role,
          features: r.payload.features,
          plan: r.payload.plan,
          expiresAt: r.payload.exp * 1000,
          activatedAt: r.payload.activated_at * 1000,
          jti: r.payload.jti,
        },
      });
    } catch {
      clearSessionToken();
      setLicenseState({ kind: "degraded", reason: "REVOKED", lastRole: null });
    }
  }, [machineFp]);

  const logout = useCallback(() => {
    clearSessionToken();
    setToken(null);
    const license = (typeof window !== "undefined" ? window.__KARATE__?.license : null);
    if (license) {
      void license.reset();
    }
    setLicenseState({ kind: "unlicensed" });
  }, []);

  const redeemCode = useCallback(async (code: string): Promise<void> => {
    await login(code);
  }, [login]);

  const api: AuthApi = useMemo(() => {
    return {
      status,
      user: status.kind === "authed" ? status.session.user : null,
      token: status.kind === "authed" ? status.session.token : null,
      isKiosk: isKioskRef.current,
      machineFingerprint: machineFp,
      licenseState,
      graceRemainingMs:
        licenseState.kind === "grace" ? licenseState.graceRemainingMs : 0,
      login, logout, redeemCode, retryRenewal,
      hasRole(role) {
        const u = status.kind === "authed" ? status.session.user : null;
        if (!u) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(u.role);
      },
    };
  }, [status, licenseState, machineFp, login, logout, redeemCode, retryRenewal]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
