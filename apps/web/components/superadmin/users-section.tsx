"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionInfo } from "@karate/core";
import { useAuth } from "@/lib/auth-context";
import {
  apiGenerateRefereeCode,
  apiGetRefereeCodes,
  apiDeleteRefereeCode,
  apiGetAppConfig,
  apiUpdateAppConfig,
  apiGetSessions,
  apiRevokeSession,
} from "@/lib/api-client";

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (remaining <= 0) return <span style={{ color: "var(--red, #e05252)" }}>expirado</span>;
  const s = Math.floor(remaining / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const color = remaining < 60_000 ? "var(--red, #e05252)" : remaining < 120_000 ? "#f0a500" : "#4ade80";
  return <span style={{ color, fontVariantNumeric: "tabular-nums" }}>{m}:{String(sec).padStart(2, "0")}</span>;
}

export function UsersSection() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [pendingCodes, setPendingCodes] = useState<{ code: string; expiresAt: number }[]>([]);
  const [ttlInput, setTtlInput] = useState("480");
  const [savingTtl, setSavingTtl] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, codes, cfg] = await Promise.all([
        apiGetSessions(token),
        apiGetRefereeCodes(token),
        apiGetAppConfig(token),
      ]);
      setSessions(s.sessions.filter((s) => s.role !== "superadmin"));
      setPendingCodes(codes.codes);
      setTtlInput(String(cfg.sessionTtlMinutes));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => { void refresh(); }, 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function handleGenerateCode() {
    if (!token) return;
    setGenerating(true);
    try {
      await apiGenerateRefereeCode(token);
      await refresh();
    } catch { alert("Error generando código"); } finally { setGenerating(false); }
  }

  async function handleDeleteCode(code: string) {
    if (!token) return;
    try {
      await apiDeleteRefereeCode(token, code);
      setPendingCodes((prev) => prev.filter((c) => c.code !== code));
    } catch { /* ignore */ }
  }

  async function handleRevoke(jti: string) {
    if (!token) return;
    try {
      await apiRevokeSession(token, jti);
      setSessions((prev) => prev.filter((s) => s.jti !== jti));
    } catch { /* ignore */ }
  }

  async function handleSaveTtl() {
    if (!token) return;
    const val = parseInt(ttlInput, 10);
    if (!val || val < 1) return;
    setSavingTtl(true);
    try { await apiUpdateAppConfig(token, val); } finally { setSavingTtl(false); }
  }

  const hasActivity = pendingCodes.length > 0 || sessions.length > 0;

  return (
    <section className="super-section">
      <h2 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Acceso & Sesiones
        <button onClick={refresh} disabled={loading} style={{ fontSize: 13 }}>
          {loading ? "Cargando…" : "Actualizar"}
        </button>
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 14px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8 }}>
        <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: "rgba(74,222,128,0.15)", color: "#4ade80", whiteSpace: "nowrap" }}>superadmin</span>
        <span style={{ fontFamily: "monospace", fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>KAR-IAS</span>
        <span style={{ fontSize: 12, color: "var(--muted, #8892a4)" }}>· nunca expira</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: "var(--panel-2, #1d2230)", borderRadius: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted, #8892a4)" }}>Duración de sesión:</span>
        <input type="number" min={1} value={ttlInput} onChange={(e) => setTtlInput(e.target.value)} style={{ width: 70 }} />
        <span style={{ fontSize: 13, color: "var(--muted, #8892a4)" }}>minutos</span>
        <button className="primary" style={{ fontSize: 12 }} disabled={savingTtl} onClick={handleSaveTtl}>
          {savingTtl ? "Guardando…" : "Guardar"}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button className="primary" onClick={handleGenerateCode} disabled={generating}>
          {generating ? "Generando…" : "Generar código de referee"}
        </button>
      </div>

      {!hasActivity ? (
        <p className="muted" style={{ fontSize: 13 }}>Sin códigos ni sesiones activas</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border, #2a3142)" }}>
              <th style={th}>Tipo</th>
              <th style={th}>Código / Inicio</th>
              <th style={th}>Expira en</th>
              <th style={th}>IP</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {pendingCodes.map((c) => (
              <tr key={c.code} style={{ borderBottom: "1px solid var(--border, #2a3142)" }}>
                <td style={td}>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: "rgba(250,204,21,0.15)", color: "#facc15" }}>
                    código pendiente
                  </span>
                </td>
                <td style={td}>
                  <span style={{ fontFamily: "monospace", fontSize: 16, letterSpacing: 3, fontWeight: 700 }}>{c.code}</span>
                </td>
                <td style={td}><Countdown expiresAt={c.expiresAt} /></td>
                <td style={td}><span className="muted">—</span></td>
                <td style={td}>
                  <button onClick={() => handleDeleteCode(c.code)} style={revokeBtn}>eliminar</button>
                </td>
              </tr>
            ))}
            {sessions.map((s) => (
              <tr key={s.jti} style={{ borderBottom: "1px solid var(--border, #2a3142)" }}>
                <td style={td}>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                    sesión activa
                  </span>
                </td>
                <td style={td}>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {new Date(s.issuedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                <td style={td}><Countdown expiresAt={s.expiresAt} /></td>
                <td style={td}><span className="muted">{s.ip ?? "—"}</span></td>
                <td style={td}>
                  <button onClick={() => handleRevoke(s.jti)} style={revokeBtn}>revocar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "6px 8px", color: "var(--muted, #8892a4)", fontWeight: 500, fontSize: 12 };
const td: React.CSSProperties = { padding: "8px 8px", verticalAlign: "middle" };
const revokeBtn: React.CSSProperties = { fontSize: 10, padding: "1px 6px", color: "var(--red, #e05252)", background: "none", border: "1px solid var(--red, #e05252)", borderRadius: 3, cursor: "pointer" };
