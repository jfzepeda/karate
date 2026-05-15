"use client";

// Fixed-position superadmin overlay rendered on top of whatever route is
// active. The underlying route remains mounted (state preserved); tournament
// config edits inside the overlay go through the same `useStore()` and are
// visible immediately when the overlay closes.

import { useEffect, useRef } from "react";
import { useOverlay } from "@/lib/overlay-context";
import { UsersSection } from "@/components/superadmin/users-section";
import { CategoriesSection } from "@/components/superadmin/categories-section";
import { CompetitorsSection } from "@/components/superadmin/competitors-section";
import { SeedingSection } from "@/components/superadmin/seeding-section";
import { SetupSection } from "@/components/superadmin/setup-section";
import { LogoSection } from "@/components/superadmin/logo-section";
import { NetworkSection } from "@/components/superadmin/network-section";
import { useStore } from "@/lib/store";

export function SuperadminOverlay() {
  const { isOpen } = useOverlay();
  const { state, loadMockTournament } = useStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    document.body.style.overflow = "hidden";
    // Move focus inside the overlay.
    requestAnimationFrame(() => {
      const focusable = containerRef.current?.querySelector<HTMLElement>(
        "button, input, select, textarea, [tabindex]"
      );
      focusable?.focus();
    });
    return () => {
      document.body.style.overflow = "";
      try { previousFocusRef.current?.focus(); } catch {}
    };
  }, [isOpen]);

  // Escape is explicitly ignored — only the close chord closes the overlay.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const noData =
    state.tournament.participants.length === 0 &&
    state.tournament.categoryDefs.length === 0;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Tournament configuration"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        background: "rgba(15,17,23,0.97)",
        overflowY: "auto",
        padding: "24px 32px 60px",
      }}
    >
      <main className="super-dashboard" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header>
          <h1>Tournament Configuration</h1>
          <p className="muted" style={{ margin: 0 }}>
            Categories, competitors, seeding, areas, branding, network. Changes apply
            immediately to all connected views.
          </p>
        </header>

        {noData ? (
          <section className="super-section">
            <h2>Get started</h2>
            <p className="muted">
              No tournament data yet. Load the demo or configure manually.
            </p>
            <div className="row">
              <button className="primary" onClick={loadMockTournament}>
                Load demo tournament (4 categories · ~180 competitors)
              </button>
            </div>
          </section>
        ) : (
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button onClick={loadMockTournament}>Reset to demo data</button>
          </div>
        )}

        <NetworkSection />
        <UsersSection />
        <CategoriesSection />
        <CompetitorsSection />
        <SeedingSection />
        <SetupSection />
        <LogoSection />
      </main>
    </div>
  );
}
