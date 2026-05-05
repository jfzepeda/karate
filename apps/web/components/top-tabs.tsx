"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin",   label: "Admin",     external: false },
  { href: "/private", label: "Private",   external: false },
  { href: "/public",  label: "Public ↗",  external: true  },
];

export function TopTabs() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/public")) return null;
  return (
    <nav id="tabs">
      {TABS.map((t) => {
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
    </nav>
  );
}
