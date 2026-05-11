"use client";

import type { AuthSession, AuthUser, SessionInfo, KioskSession } from "@karate/core";

/**
 * Resolve the backend base URL.
 * - In Electron, the preload script sets window.__KARATE__.serverUrl.
 * - In dev/web, override via NEXT_PUBLIC_KARATE_SERVER_URL or localStorage key
 *   "karate.serverUrl"; otherwise default to localhost:47291.
 */
declare global {
  interface Window {
    __KARATE__?: {
      serverUrl?: string;
      isElectron?: boolean;
      kioskSession?: { token: string; issuedAt: number; expiresAt: number; user: { role: string } } | null;
    };
  }
}

const DEFAULT_PORT = 47291;

export function getServerUrl(): string {
  if (typeof window === "undefined") return `http://127.0.0.1:${DEFAULT_PORT}`;
  if (window.__KARATE__?.serverUrl) return window.__KARATE__.serverUrl;
  const override = window.localStorage.getItem("karate.serverUrl");
  if (override) return override;
  const envUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_KARATE_SERVER_URL
      : undefined;
  if (envUrl) return envUrl;
  return `http://127.0.0.1:${DEFAULT_PORT}`;
}

export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.__KARATE__?.isElectron;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  isForm?: boolean;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.isForm) {
      body = opts.body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
  }
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const url = getServerUrl().replace(/\/+$/, "") + path;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    body,
    headers,
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) {
    let code = "request_failed";
    let message = res.statusText;
    try {
      const j = await res.json();
      if (typeof j?.error === "string") code = j.error;
      if (typeof j?.message === "string") message = j.message;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json")) return (await res.text()) as unknown as T;
  return (await res.json()) as T;
}

// ---------- Auth endpoints ----------
export async function apiLogin(code: string): Promise<AuthSession> {
  return apiRequest("/api/login", {
    method: "POST",
    body: { code },
  });
}

export async function apiMe(token: string): Promise<{ user: AuthUser }> {
  return apiRequest("/api/me", { token });
}

// ---------- Kiosk ----------
export async function apiGetKioskSession(signal?: AbortSignal): Promise<KioskSession> {
  return apiRequest<KioskSession>("/api/kiosk-session", { signal });
}

export interface LaunchConfig {
  issuedAt: number;
  expiresAt: number;
  role: string;
  data: Record<string, unknown>;
}

export async function apiGenerateLaunch(token: string): Promise<LaunchConfig> {
  return apiRequest<LaunchConfig>("/api/generate-launch", { token, method: "POST" });
}

export async function apiPrepareDownload(token: string): Promise<{ tokenId: string }> {
  return apiRequest("/api/prepare-download", { token, method: "POST" });
}

// ---------- Downloads ----------
export interface DownloadInfo {
  mac: string | null;
  win: string | null;
}

export async function apiGetDownloadInfo(): Promise<DownloadInfo> {
  return apiRequest("/api/download-info");
}

export function downloadUrl(filename: string): string {
  return getServerUrl().replace(/\/+$/, "") + `/api/downloads/${encodeURIComponent(filename)}`;
}

// ---------- Session management (superadmin) ----------
export async function apiGetSessions(token: string): Promise<{ sessions: SessionInfo[] }> {
  return apiRequest("/api/sessions", { token });
}

export async function apiRevokeSession(token: string, jti: string): Promise<{ ok: true }> {
  return apiRequest(`/api/sessions/${encodeURIComponent(jti)}`, { token, method: "DELETE" });
}

// ---------- Referee code generation (superadmin) ----------
export async function apiGenerateRefereeCode(token: string): Promise<{ code: string }> {
  return apiRequest("/api/referee-code", { token, method: "POST" });
}

export async function apiGetRefereeCodes(token: string): Promise<{ codes: { code: string; expiresAt: number }[] }> {
  return apiRequest("/api/referee-codes", { token });
}

export async function apiDeleteRefereeCode(token: string, code: string): Promise<{ ok: true }> {
  return apiRequest(`/api/referee-codes/${encodeURIComponent(code)}`, { token, method: "DELETE" });
}

// ---------- Tournament data ----------
export interface TournamentDataFile {
  version: number;
  updatedAt: number;
  etag: string;
  data: Record<string, unknown>;
}

export async function apiGetData(token: string): Promise<TournamentDataFile> {
  return apiRequest("/api/data", { token });
}

export async function apiPutData(
  token: string,
  data: Record<string, unknown>
): Promise<TournamentDataFile> {
  return apiRequest("/api/data", { token, method: "PUT", body: data });
}

// ---------- Logo ----------
export interface LogoInfo {
  filename: string;
  mime: string;
  size: number;
  url: string;
}

export async function apiGetLogoInfo(token: string): Promise<{ logo: LogoInfo | null }> {
  return apiRequest("/api/logo-info", { token });
}

export async function apiUploadLogo(token: string, file: File): Promise<{ logo: LogoInfo | null }> {
  const fd = new FormData();
  fd.append("logo", file);
  return apiRequest("/api/upload-logo", {
    token,
    method: "POST",
    body: fd,
    isForm: true,
  });
}

export async function apiRemoveLogo(token: string): Promise<{ ok: true }> {
  return apiRequest("/api/upload-logo", { token, method: "DELETE" });
}

export function logoSrc(): string {
  return getServerUrl().replace(/\/+$/, "") + "/api/logo";
}

// ---------- App config (superadmin) ----------
export async function apiGetAppConfig(token: string): Promise<{ sessionTtlMinutes: number }> {
  return apiRequest("/api/app-config", { token });
}

export async function apiUpdateAppConfig(token: string, sessionTtlMinutes: number): Promise<{ sessionTtlMinutes: number }> {
  return apiRequest("/api/app-config", { token, method: "PUT", body: { sessionTtlMinutes } });
}

// Re-export SessionInfo for consumers
export type { SessionInfo };
