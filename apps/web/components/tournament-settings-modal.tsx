"use client";

import { useEffect, useState } from "react";
import type { DisciplineMode, SubcategorySize } from "@karate/core";
import { useStore } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TournamentSettingsModal({ open, onClose }: Props) {
  const { state, applyTournamentSettings } = useStore();
  const [size, setSize] = useState<SubcategorySize>(
    state.tournament.settings.subcategorySize
  );
  const [mode, setMode] = useState<DisciplineMode>(
    state.tournament.settings.disciplineMode
  );

  useEffect(() => {
    if (!open) return;
    setSize(state.tournament.settings.subcategorySize);
    setMode(state.tournament.settings.disciplineMode);
  }, [open, state.tournament.settings]);

  if (!open) return null;

  const apply = () => {
    const ok = applyTournamentSettings(size, mode);
    if (ok || (size === state.tournament.settings.subcategorySize &&
              mode === state.tournament.settings.disciplineMode)) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Tournament Settings</h2>

        <h3>Subcategory Size</h3>
        <div className="radio-group">
          {[4, 8, 16].map((v) => (
            <label
              key={v}
              className={size === v ? "checked" : ""}
              onClick={() => setSize(v as SubcategorySize)}
            >
              <input type="radio" name="subsize" checked={size === v} readOnly />
              {v}
            </label>
          ))}
        </div>

        <h3>Discipline Mode</h3>
        <div className="radio-group">
          {(["combat", "kata", "both"] as DisciplineMode[]).map((m) => (
            <label
              key={m}
              className={mode === m ? "checked" : ""}
              onClick={() => setMode(m)}
            >
              <input type="radio" name="discmode" checked={mode === m} readOnly />
              {m === "combat" ? "Combat" : m === "kata" ? "Kata" : "Both"}
            </label>
          ))}
        </div>

        <p className="warn">
          ⚠ Applying will reset all bracket progress and clear the live scoreboard.
        </p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={apply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
