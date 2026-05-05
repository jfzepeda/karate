"use client";

import type { AppState } from "@karate/core";
import { computeWinner } from "@karate/core";

function formatTime(s: number) {
  s = Math.max(0, Math.floor(s));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function shouldBlink(state: AppState): "blue" | "red" | null {
  const m = state.match;
  const isKata = m.discipline === "kata";
  const fiveOut =
    !isKata &&
    (m.bluePenalties >= 5 ||
      m.redPenalties >= 5 ||
      m.blueEliminated ||
      m.redEliminated);
  const elimKata = isKata && (m.blueEliminated || m.redEliminated);
  const finished = state.timer.finished && !isKata;
  if (!fiveOut && !finished && !elimKata) return null;
  return computeWinner(m);
}

interface Props {
  state: AppState;
  /** When 'public', sides are mirrored (red on left). */
  variant: "private" | "public";
}

export function Scoreboard({ state, variant }: Props) {
  const m = state.match;
  const t = state.timer;
  const blink = shouldBlink(state);
  const matchType = m.discipline ? m.discipline.toUpperCase() : "";

  const blue = (
    <div className="side blue">
      <span className="role-tag">Blue · Azul</span>
      <div className={`name ${m.blueEliminated ? "eliminated" : ""}`}>
        {m.blueName || "—"}
      </div>
      <div className="score-row">
        <div className={`score ${blink === "blue" ? "blink" : ""}`}>
          {m.bluePoints}
        </div>
        <div className={`star ${m.blueAdvantage ? "on" : ""}`}>★</div>
      </div>
      <Penalties count={m.bluePenalties} />
    </div>
  );

  const red = (
    <div className="side red">
      <span className="role-tag">Red · Aka</span>
      <div className={`name ${m.redEliminated ? "eliminated" : ""}`}>
        {m.redName || "—"}
      </div>
      <div className="score-row">
        {variant === "public" ? (
          <>
            <div className={`score ${blink === "red" ? "blink" : ""}`}>
              {m.redPoints}
            </div>
            <div className={`star ${m.redAdvantage ? "on" : ""}`}>★</div>
          </>
        ) : (
          <>
            <div className={`star ${m.redAdvantage ? "on" : ""}`}>★</div>
            <div className={`score ${blink === "red" ? "blink" : ""}`}>
              {m.redPoints}
            </div>
          </>
        )}
      </div>
      <Penalties count={m.redPenalties} />
    </div>
  );

  const center = (
    <div className="center">
      <div className="timer-label">Time Remaining</div>
      <div
        className={
          "timer " +
          (t.remaining === 0
            ? "zero"
            : t.remaining <= 15
            ? "warn"
            : "") +
          (!t.running && t.remaining > 0 && !t.finished ? " paused" : "")
        }
      >
        {formatTime(t.remaining)}
      </div>
      <div className="timer-status">
        {variant === "private"
          ? t.finished
            ? "Time"
            : t.running
            ? "Running"
            : "Paused"
          : t.finished
          ? "Time"
          : ""}
      </div>
      {variant === "private" ? (
        <div className="kb-hints">
          Space: pause/resume · +/- adjust 1s · R/A select · 1/2/3 points · S
          advantage · C penalty · Del undo
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div className={`match-type-label ${m.discipline || ""}`}>
        {matchType}
      </div>
      <div className="split">
        {variant === "public" ? (
          <>
            {red}
            {center}
            {blue}
          </>
        ) : (
          <>
            {blue}
            {center}
            {red}
          </>
        )}
      </div>
    </>
  );
}

function Penalties({ count }: { count: number }) {
  return (
    <div className="penalties">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={"penalty" + (i < count ? " on" : "")} />
      ))}
    </div>
  );
}
