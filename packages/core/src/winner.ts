import type { MatchState } from "./types";

export function computeCombatWinner(m: MatchState): "blue" | "red" | null {
  const blueOut = m.blueEliminated || m.bluePenalties >= 5;
  const redOut = m.redEliminated || m.redPenalties >= 5;
  if (blueOut && !redOut) return "red";
  if (redOut && !blueOut) return "blue";
  if (blueOut && redOut) return null;
  if (m.bluePoints > m.redPoints) return "blue";
  if (m.redPoints > m.bluePoints) return "red";
  if (m.blueAdvantage && !m.redAdvantage) return "blue";
  if (m.redAdvantage && !m.blueAdvantage) return "red";
  return null;
}

export function computeKataWinner(m: MatchState): "blue" | "red" | null {
  if (m.blueEliminated && !m.redEliminated) return "red";
  if (m.redEliminated && !m.blueEliminated) return "blue";
  if (m.bluePoints > m.redPoints) return "blue";
  if (m.redPoints > m.bluePoints) return "red";
  return null;
}

export function computeWinner(m: MatchState): "blue" | "red" | null {
  return m.discipline === "kata"
    ? computeKataWinner(m)
    : computeCombatWinner(m);
}
