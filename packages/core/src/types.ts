export type Discipline = "combat" | "kata";
export type DisciplineMode = Discipline | "both";
export type SubcategorySize = 4 | 8 | 16;

export type SubcategoryType =
  | "standard"
  | "playin"
  | "series"
  | "roundrobin";

export type BeltColor =
  | "white"
  | "yellow"
  | "orange"
  | "green"
  | "blue"
  | "purple"
  | "brown"
  | "black";

export type AgeRange = "4-6" | "7-9" | "10-12" | "13-15" | "16-17" | "adult";

export interface Participant {
  id: string;
  nombre: string;
  apellido: string;
  beltColor: BeltColor;
  age: number;
}

export interface MatchResultSide {
  name: string;
  points: number;
  penalties: number;
  advantage: boolean;
}
export interface MatchResult {
  p1: MatchResultSide;
  p2: MatchResultSide;
}

export interface Match {
  p1: string | null;
  p2: string | null;
  winner: string | null;
  eliminated: string | null;
  jury: boolean;
  result: MatchResult | null;
  pair?: "ab" | "ac" | "bc";
}

export interface StandardTree {
  rounds: Match[][];
  champion: string | null;
}
export interface PlayinTree {
  extra: Match;
  bracket: StandardTree;
}
export interface SeriesTree {
  matches: [Match, Match];
  winner: string | null;
  juryDecided: boolean;
}
export interface RRRanking {
  name: string;
  w: number;
  l: number;
  pts: number;
  pen: number;
  senshu: number;
}
export interface RRTree {
  matches: Match[];
  rankings: RRRanking[] | null;
  winner: string | null;
  juryDecided: boolean;
}

export type AnyTree = StandardTree | PlayinTree | SeriesTree | RRTree;

export interface Subcategory {
  id: string;
  categoryId: string;
  type: SubcategoryType;
  label: string;
  tag: "" | "playin" | "series" | "rr";
  competitors: string[];
  trees: Partial<Record<Discipline, AnyTree>>;
  activeDiscipline: Discipline;
}

export interface Category {
  id: string;
  name: string;
  beltColor: BeltColor;
  ageRange: AgeRange;
  competitors: string[];
  subcategories: Subcategory[];
  activeSubcategoryId: string | null;
  champion: Partial<Record<Discipline, string>>;
}

export interface TournamentSettings {
  subcategorySize: SubcategorySize;
  disciplineMode: DisciplineMode;
}

export interface MatchPathStd {
  kind: "std";
  round: number;
  idx: number;
}
export interface MatchPathPlayin {
  kind: "playin";
}
export interface MatchPathSeries {
  kind: "series";
  idx: number;
}
export interface MatchPathRR {
  kind: "rr";
  pair: "ab" | "ac" | "bc";
}
export type MatchPath =
  | MatchPathStd
  | MatchPathPlayin
  | MatchPathSeries
  | MatchPathRR;

export interface ActiveMatchRef {
  categoryId: string;
  subcategoryId: string;
  discipline: Discipline;
  path: MatchPath;
}

export interface MatchState {
  blueName: string;
  redName: string;
  bluePoints: number;
  redPoints: number;
  bluePenalties: number;
  redPenalties: number;
  blueAdvantage: boolean;
  redAdvantage: boolean;
  blueEliminated: boolean;
  redEliminated: boolean;
  discipline: Discipline | null;
  activeMatchRef: ActiveMatchRef | null;
}

export interface TimerState {
  duration: number;
  remaining: number;
  running: boolean;
  finished: boolean;
}

export type CommandKey =
  | "selectRed"
  | "selectBlue"
  | "add1"
  | "add2"
  | "add3"
  | "senshu"
  | "penalty"
  | "undo"
  | "pauseTimer"
  | "addSecond"
  | "subSecond";

export interface AppSettings {
  defaultDuration: number;
  keys: Record<CommandKey, string>;
}

export interface JuryContextMatch {
  kind: "match";
  ref: ActiveMatchRef;
}
export interface JuryContextSeries {
  kind: "series-final";
  subRef: { categoryId: string; subcategoryId: string; discipline: Discipline };
}
export interface JuryContextRR {
  kind: "rr-final";
  subRef: { categoryId: string; subcategoryId: string; discipline: Discipline };
}
export type JuryContext =
  | JuryContextMatch
  | JuryContextSeries
  | JuryContextRR;

export interface JuryState {
  competitors: [string, string];
  context: JuryContext;
}

export interface AppState {
  tournament: {
    settings: TournamentSettings;
    participants: Participant[];
    categories: Record<string, Category>;
    categoryOrder: string[];
    activeCategoryId: string | null;
  };
  match: MatchState;
  timer: TimerState;
  settings: AppSettings;
  jury: JuryState | null;
}
