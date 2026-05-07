"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const REASON_TEXT: Record<string, { title: string; body: string }> = {
  offline: {
    title: "Your access needs to be renewed",
    body: "Connect to the internet so we can refresh your access. Your tournament data is still cached locally.",
  },
  account_revoked: {
    title: "Account deactivated",
    body: "This account has been deactivated. Contact the tournament administrator to restore access.",
  },
  account_expired: {
    title: "Account expired",
    body: "This account's term has ended. Contact the administrator to extend it.",
  },
  invalid_credentials: {
    title: "Stored credentials no longer work",
    body: "Sign in again with valid credentials.",
  },
};

export function LockScreen({ reason }: { reason: string }) {
  const { retryRenewal, logout } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const text = REASON_TEXT[reason] ?? {
    title: "Access restricted",
    body: reason || "Renewal failed. Try again or sign out and back in.",
  };

  async function retry() {
    setRetrying(true);
    try {
      await retryRenewal();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-locked">
        <h1>{text.title}</h1>
        <p>{text.body}</p>
        <div className="row">
          <button className="primary" onClick={retry} disabled={retrying}>
            {retrying ? "Trying…" : "Try again"}
          </button>
          <button onClick={logout}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
