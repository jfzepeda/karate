"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function TopTabs() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { status, user, logout } = useAuth();

  // The public scoreboard view is chromeless.
  if (pathname.startsWith("/public")) return null;
  // Login / lock screens render their own chrome.
  if (status.kind === "loading" || status.kind === "anonymous" || status.kind === "locked") {
    return null;
  }

  const role = user?.role;
  const tabs: { href: string; label: string; external?: boolean }[] = [];

  if (role === "superadmin") {
    tabs.push({ href: "/superadmin", label: "Configure" });
    tabs.push({ href: "/admin", label: "Admin" });
    tabs.push({ href: "/private", label: "Private" });
    tabs.push({ href: "/public", label: "Public ↗", external: true });
  } else if (role === "referee") {
    tabs.push({ href: "/admin", label: "Admin" });
    tabs.push({ href: "/private", label: "Private" });
    tabs.push({ href: "/public", label: "Public ↗", external: true });
  }

  return (
    <nav id="tabs">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        if (t.external) {
          return (
            <a
              key={t.href}
              href={t.href}
              target="_blank"
              rel="noopener"
              className={active ? "active" : ""}
            >
              {t.label}
            </a>
          );
        }
        return (
          <Link
            key={t.href}
            href={t.href}
            className={active ? "active" : ""}
          >
            {t.label}
          </Link>
        );
      })}
      <span className="brand">KARATE TOURNAMENT</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8, alignItems: "center" }}>
        {role === "referee" ? (
          <button
            type="button"
            className="topbar-link"
            onClick={() => router.push("/area-select")}
            title="Choose a different competition area"
          >
            ← Change Area
          </button>
        ) : null}
        <span className="topbar-user">{user?.username}</span>
        <button type="button" className="topbar-link" onClick={logout}>
          Sign out
        </button>
      </span>
    </nav>
  );
}
