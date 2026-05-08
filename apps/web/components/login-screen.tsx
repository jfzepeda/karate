"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function LoginScreen() {
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(code.trim());
    } catch {
      setError("Código inválido");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 7);
    setCode(v);
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Karate Tournament</h1>
        <p className="muted">Ingresa tu código de acceso</p>
        <input
          autoFocus
          value={code}
          onChange={handleChange}
          placeholder="XXX-XXX"
          maxLength={7}
          style={{ textAlign: "center", letterSpacing: 6, fontSize: 22, width: "100%" }}
          disabled={submitting}
        />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="primary" disabled={submitting || !code.trim()}>
          {submitting ? "Verificando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
