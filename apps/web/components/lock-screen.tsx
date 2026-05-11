"use client";

import { useState } from "react";
import type { LicenseDegradedReason } from "@karate/core";
import { useAuth } from "@/lib/auth-context";

const REASON_COPY: Record<LicenseDegradedReason, { title: string; body: string }> = {
  EXPIRED: {
    title: "License expired",
    body: "Your license has expired. Enter a new access code below or contact your administrator to renew.",
  },
  REVOKED: {
    title: "Access revoked",
    body: "This license has been revoked. If you believe this is a mistake, contact your administrator.",
  },
  MACHINE_MISMATCH: {
    title: "Device not recognized",
    body: "This license is registered to a different device. Ask your administrator to transfer it, then enter the original code.",
  },
  CLOCK_TAMPER: {
    title: "Clock error",
    body: "Your system clock appears to have moved backward. Set the correct date and time, then restart the app.",
  },
  INVALID_SIGNATURE: {
    title: "Invalid license",
    body: "Your license file failed verification. Enter a new access code below to reactivate.",
  },
  STORAGE_CORRUPTED: {
    title: "License storage corrupted",
    body: "We could not read the locally-cached license. Enter your access code below to reactivate.",
  },
};

export function LockScreen({ reason }: { reason: LicenseDegradedReason | string }) {
  const { redeemCode } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const info = REASON_COPY[reason as LicenseDegradedReason] ?? {
    title: "Access restricted",
    body: typeof reason === "string" ? reason : "Unknown reason.",
  };

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter a 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await redeemCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-locked">
        <h1>{info.title}</h1>
        <p>{info.body}</p>
        <form onSubmit={handleRedeem} style={{ marginTop: 18 }}>
          <p className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Have a new access code? Enter it here to reactivate.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            style={{
              textAlign: "center",
              letterSpacing: 8,
              fontSize: 22,
              width: "100%",
              marginBottom: 10,
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          />
          {error && <p style={{ color: "var(--red, #e05252)", marginBottom: 8, fontSize: 13 }}>{error}</p>}
          <button type="submit" className="primary" disabled={loading || code.length !== 6} style={{ width: "100%" }}>
            {loading ? "Activating…" : "Reactivate"}
          </button>
        </form>
      </div>
    </div>
  );
}
