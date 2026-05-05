"use client";

import { subcategoryStatus } from "@karate/core";
import { useStore } from "@/lib/store";

interface Props {
  onOpenTournamentSettings: () => void;
}

export function AdminSidebar({ onOpenTournamentSettings }: Props) {
  const { state, setActiveCategory, setActiveSubcategory } = useStore();
  const t = state.tournament;
  return (
    <aside className="admin-sidebar">
      <button className="tourn-settings-btn" onClick={onOpenTournamentSettings}>
        ⚙ Tournament Settings
      </button>
      <h3>Categories</h3>
      <div>
        {t.categoryOrder.map((cid) => {
          const cat = t.categories[cid];
          const isActiveCat = cid === t.activeCategoryId;
          return (
            <div key={cid} className="cat-group">
              <button
                className={`cat-btn ${isActiveCat ? "active" : ""}`}
                onClick={() => setActiveCategory(cid)}
              >
                <span>{cat.name}</span>
                <span className="count">
                  {cat.competitors.length} · {cat.subcategories.length}
                </span>
              </button>
              {isActiveCat ? (
                <div className="subcat-list">
                  {cat.subcategories.map((sub) => {
                    const status = subcategoryStatus(sub);
                    const isActiveSub = sub.id === cat.activeSubcategoryId;
                    return (
                      <button
                        key={sub.id}
                        className={`subcat-btn ${isActiveSub ? "active" : ""}`}
                        onClick={() => setActiveSubcategory(cid, sub.id)}
                      >
                        <span className={`status-dot ${status}`} />
                        <span>{sub.label}</span>
                        {sub.tag ? (
                          <span className={`subcat-tag ${sub.tag}`}>
                            {sub.tag}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
