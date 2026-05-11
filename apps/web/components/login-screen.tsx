"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const ERROR_COPY: Record<string, string> = {
  CODE_NOT_FOUND: "This code does not exist. Check for typos.",
  CODE_EXPIRED: "This code has expired. Please contact support for a new one.",
  CODE_ALREADY_USED: "This code has already been activated on another device.",
  MACHINE_ALREADY_REGISTERED: "This device is already linked to a different access code. Contact support to transfer your license.",
  RATE_LIMITED: "Too many attempts. Please wait 15 minutes before trying again.",
  ACCESS_REVOKED: "This license has been revoked. Contact support.",
  INVALID_FINGERPRINT: "Could not identify this device.",
  LOCAL_VERIFY_FAILED: "Server returned a token we could not verify. Contact support.",
};

export function LoginScreen() {
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter a 6-digit code.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(code);
    } catch (err) {
      const code = err instanceof Error ? err.message : "unknown_error";
      setError(ERROR_COPY[code] ?? "Could not connect to the activation server. Check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Karate Tournament</h1>
        <p className="muted">Enter your 6-digit access code</p>
        <input
          autoFocus
          value={code}
          onChange={handleChange}
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          style={{
            textAlign: "center",
            letterSpacing: 10,
            fontSize: 28,
            width: "100%",
            fontFamily: "ui-monospace, Menlo, monospace",
          }}
          disabled={submitting}
        />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="primary" disabled={submitting || code.length !== 6}>
          {submitting ? "Activating…" : "Activate"}
        </button>
      </form>
    </div>
  );
}
