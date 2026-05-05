"use client";

import { useState } from "react";
import type { Discipline, PlayinTree, RRTree, SeriesTree, StandardTree } from "@karate/core";
import { useStore } from "@/lib/store";
import { AdminSidebar } from "@/components/sidebar";
import { BracketRenderer } from "@/components/bracket";
import { TournamentSettingsModal } from "@/components/tournament-settings-modal";

export default function AdminPage() {
  const { state, setActiveDiscipline } = useStore();
  const [tournModalOpen, setTournModalOpen] = useState(false);
  const cat = state.tournament.categories[state.tournament.activeCategoryId];
  const sub = cat?.subcategories.find(
    (s) => s.id === cat.activeSubcategoryId
  ) || null;

  const champions: Partial<Record<Discipline, string>> = {};
  if (sub) {
    for (const [disc, tree] of Object.entries(sub.trees)) {
      const champ =
        sub.type === "standard"
          ? (tree as StandardTree).champion
          : sub.type === "playin"
          ? (tree as PlayinTree).bracket.champion
          : sub.type === "series"
          ? (tree as SeriesTree).winner
          : sub.type === "roundrobin"
          ? (tree as RRTree).winner
          : null;
      if (champ) champions[disc as Discipline] = champ;
    }
  }
  const champKeys = Object.keys(champions);

  return (
    <section id="view-admin">
      <AdminSidebar onOpenTournamentSettings={() => setTournModalOpen(true)} />
      <div className="admin-main">
        <div className="admin-header">
          <div>
            <h2>{cat ? cat.name : "Select a category"}</h2>
            <div className="admin-subtitle">
              {cat
                ? sub
                  ? `${sub.label} · ${sub.competitors.length} competitors`
                  : `${cat.competitors.length} total competitors · ${cat.subcategories.length} subcategories`
                : ""}
            </div>
          </div>
        </div>

        {sub && champKeys.length > 0 ? (
          <div className="champion-banner">
            {Object.keys(sub.trees).length > 1 ? (
              <div className="pair">
                {(["combat", "kata"] as Discipline[]).map((d) =>
                  sub.trees[d] ? (
                    <div key={d} className="col">
                      <div className="label">{d.toUpperCase()} CHAMPION</div>
                      <div className="name">
                        {champions[d] ? `🏆 ${champions[d]}` : "—"}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <>
                <div className="label">
                  {(Object.keys(sub.trees)[0] as string).toUpperCase()} CHAMPION
                  · {sub.label}
                </div>
                <div className="name">
                  🏆 {champions[Object.keys(sub.trees)[0] as Discipline]}
                </div>
              </>
            )}
          </div>
        ) : null}

        {sub && Object.keys(sub.trees).length > 1 ? (
          <div className="discipline-tabs">
            {(Object.keys(sub.trees) as Discipline[]).map((d) => (
              <button
                key={d}
                className={`discipline-tab ${d} ${
                  sub.activeDiscipline === d ? "active" : ""
                }`}
                onClick={() =>
                  setActiveDiscipline(cat!.id, sub.id, d)
                }
              >
                {d}
              </button>
            ))}
          </div>
        ) : null}

        {sub ? (
          <BracketRenderer sub={sub} discipline={sub.activeDiscipline} />
        ) : null}
      </div>
      <TournamentSettingsModal
        open={tournModalOpen}
        onClose={() => setTournModalOpen(false)}
      />
    </section>
  );
}
