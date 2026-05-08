"use client";

import { useStore } from "@/lib/store";
import { CategoriesSection } from "@/components/superadmin/categories-section";
import { CompetitorsSection } from "@/components/superadmin/competitors-section";
import { SeedingSection } from "@/components/superadmin/seeding-section";
import { SetupSection } from "@/components/superadmin/setup-section";
import { LogoSection } from "@/components/superadmin/logo-section";
import { UsersSection } from "@/components/superadmin/users-section";

export default function SuperadminPage() {
  const { state, loadMockTournament } = useStore();
  const noData =
    state.tournament.participants.length === 0 &&
    state.tournament.categoryDefs.length === 0;

  return (
    <main className="super-dashboard">
      <header>
        <h1>Tournament Configuration</h1>
        <p className="muted" style={{ margin: 0 }}>
          Categories, competitors, seeding, areas and branding. Changes apply
          immediately to all connected views.
        </p>
      </header>

      {noData ? (
        <section className="super-section">
          <h2>Get started</h2>
          <p className="muted">No tournament data yet. Load the demo or configure manually.</p>
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

      <UsersSection />
      <CategoriesSection />
      <CompetitorsSection />
      <SeedingSection />
      <SetupSection />
      <LogoSection />
    </main>
  );
}
