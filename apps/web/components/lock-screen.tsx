"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function LockScreen({ reason }: { reason: string }) {
  const { redeemCode } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isKioskExpired = reason === "kiosk_expired";
  const isSessionExpired = reason === "session_expired";

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await redeemCode(code.trim());
    } catch {
      setError("Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  }

  if (isKioskExpired) {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-locked">
          <h1>Token expirado</h1>
          <p>El tiempo de acceso ha terminado.</p>
        </div>
      </div>
    );
  }

  if (isSessionExpired) {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-locked">
          <h1>Sesión expirada</h1>
          <p>Contacta al administrador para obtener un código de acceso.</p>
          <form onSubmit={handleRedeem} style={{ marginTop: 16 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXX-XXX"
              maxLength={7}
              style={{ textAlign: "center", letterSpacing: 4, fontSize: 18, width: "100%", marginBottom: 10 }}
              autoFocus
            />
            {error && <p style={{ color: "var(--red, #e05252)", marginBottom: 8, fontSize: 13 }}>{error}</p>}
            <button type="submit" className="primary" disabled={loading || !code.trim()} style={{ width: "100%" }}>
              {loading ? "Verificando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Generic fallback for other lock reasons (account_revoked, offline, etc.)
  return (
    <div className="auth-screen">
      <div className="auth-card auth-locked">
        <h1>Acceso restringido</h1>
        <p>{reason}</p>
      </div>
    </div>
  );
}
