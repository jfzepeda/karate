"use client";

/**
 * AuthGate sits between the layout's providers and the page content. It:
 *
 *   - Shows the login screen when the user is unauthenticated.
 *   - Shows the lock screen when a token is expired and renewal failed.
 *   - Optionally enforces role gating (e.g., superadmin-only routes).
 *   - For the public scoreboard route, allows anonymous access (the audience
 *     screen does not require login — it just mirrors live state from the
 *     authed admin/private windows over BroadcastChannel).
 */

import type { Role } from "@karate/core";
import { useAuth } from "@/lib/auth-context";
import { LoginScreen } from "./login-screen";
import { LockScreen } from "./lock-screen";

interface Props {
  children: React.ReactNode;
  /** When provided, page is gated to these roles only. */
  roles?: Role[];
  /** When true, renders children even if unauthenticated (used by /public). */
  allowAnonymous?: boolean;
}

export function AuthGate({ children, roles, allowAnonymous }: Props) {
  const { status, hasRole } = useAuth();

  if (status.kind === "loading") {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-loading">Loading…</div>
      </div>
    );
  }

  if (status.kind === "anonymous") {
    if (allowAnonymous) return <>{children}</>;
    return <LoginScreen />;
  }

  if (status.kind === "locked") {
    if (allowAnonymous) return <>{children}</>;
    return <LockScreen reason={status.reason} />;
  }

  if (roles && !hasRole(roles)) {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-locked">
          <h1>Restricted</h1>
          <p>This area is only available to {roles.join(" / ")}.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
