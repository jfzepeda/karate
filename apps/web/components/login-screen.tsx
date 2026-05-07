"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      const err = e as ApiError;
      const msg = describeError(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Karate Tournament</h1>
        <p className="muted">Sign in to continue</p>
        <label>
          Username
          <input
            autoFocus
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </label>
        {error ? <div className="auth-error">{error}</div> : null}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <div className="muted small auth-footnote">
          Server: <code>{getServerLabel()}</code>
        </div>
      </form>
    </div>
  );
}

function getServerLabel(): string {
  if (typeof window === "undefined") return "(server)";
  if (window.__KARATE__?.serverUrl) return window.__KARATE__.serverUrl;
  return window.localStorage.getItem("karate.serverUrl") ?? "auto";
}

function describeError(err: ApiError | Error | null): string {
  if (!err) return "Sign-in failed.";
  if (err instanceof ApiError) {
    switch (err.code) {
      case "invalid_credentials":
        return "Wrong username or password.";
      case "account_expired":
        return "This account has expired. Contact the administrator.";
      case "account_revoked":
        return "This account has been deactivated.";
      case "missing_fields":
        return "Both username and password are required.";
      default:
        return err.code || err.message || "Sign-in failed.";
    }
  }
  // Likely a network error.
  return "Could not reach the server. Check your connection and try again.";
}
