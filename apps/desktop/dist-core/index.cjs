"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../packages/core/src/index.ts
var index_exports = {};
__export(index_exports, {
  AGE_RANGES: () => AGE_RANGES,
  AGE_RANGE_LABEL: () => AGE_RANGE_LABEL,
  BELT_ALIASES: () => BELT_ALIASES,
  BELT_LABEL_EN: () => BELT_LABEL_EN,
  BELT_ORDER: () => BELT_ORDER,
  CHANNEL_NAME: () => CHANNEL_NAME,
  DEFAULT_ENGINE_CONFIG: () => DEFAULT_ENGINE_CONFIG,
  DEFAULT_KEYS: () => DEFAULT_KEYS,
  KATA_DISABLED_COMMANDS: () => KATA_DISABLED_COMMANDS,
  KEY_LABELS: () => KEY_LABELS,
  STORAGE_KEY: () => STORAGE_KEY,
  TIMER_OWNER_KEY: () => TIMER_OWNER_KEY,
  addCategoryDef: () => addCategoryDef,
  addParticipant: () => addParticipant,
  ageRangeFor: () => ageRangeFor,
  allMatchesComplete: () => allMatchesComplete,
  areaLabel: () => areaLabel,
  assignSubcategoryToArea: () => assignSubcategoryToArea,
  buildAreaPlan: () => buildAreaPlan,
  buildInitialEngineState: () => buildInitialEngineState,
  buildInitialState: () => buildInitialState,
  buildPlayinTree: () => buildPlayinTree,
  buildRRTree: () => buildRRTree,
  buildSeriesTree: () => buildSeriesTree,
  buildStandardTree: () => buildStandardTree,
  buildSubcategory: () => buildSubcategory,
  buildSubcategorySpecs: () => buildSubcategorySpecs,
  buildTreeFromSpec: () => buildTreeFromSpec,
  captureSb: () => captureSb,
  categoryDefMatches: () => categoryDefMatches,
  categoryHasArea: () => categoryHasArea,
  categoryIdFor: () => categoryIdFor,
  categoryNameFor: () => categoryNameFor,
  closeCheckIn: () => closeCheckIn,
  computeAreaStatus: () => computeAreaStatus,
  computeCombatWinner: () => computeCombatWinner,
  computeKataWinner: () => computeKataWinner,
  computeWinner: () => computeWinner,
  consolidatePlayinOrphans: () => consolidatePlayinOrphans,
  defaultCategoryDefs: () => defaultCategoryDefs,
  describeCategoryDef: () => describeCategoryDef,
  describeRefLabel: () => describeRefLabel,
  distributeRemainder: () => distributeRemainder,
  emptyMatch: () => emptyMatch,
  ensureEngineState: () => ensureEngineState,
  finalizeMatchByRef: () => finalizeMatchByRef,
  finalizeRR: () => finalizeRR,
  finalizeSeries: () => finalizeSeries,
  findCategoryForParticipant: () => findCategoryForParticipant,
  findNextMatch: () => findNextMatch,
  fullName: () => fullName,
  generateMockTournament: () => generateMockTournament,
  generateRandomSeed: () => generateRandomSeed,
  getCategory: () => getCategory,
  getMatchByRef: () => getMatchByRef,
  getSubcategory: () => getSubcategory,
  hydrateEngineFromBracket: () => hydrateEngineFromBracket,
  listReadyMatches: () => listReadyMatches,
  loadMatchToScoreboardImpl: () => loadMatchToScoreboardImpl,
  loadState: () => loadState,
  markCompetitorAbsent: () => markCompetitorAbsent,
  matchIdFromRef: () => matchIdFromRef,
  mulberry32: () => mulberry32,
  newCategoryDefId: () => newCategoryDefId,
  newParticipantId: () => newParticipantId,
  parseParticipantsCsv: () => parseParticipantsCsv,
  propagateBracketWinner: () => propagateBracketWinner,
  rebuildAllSubcategories: () => rebuildAllSubcategories,
  rebuildCategoriesFromParticipants: () => rebuildCategoriesFromParticipants,
  rebuildCategorySubcategories: () => rebuildCategorySubcategories,
  recordMatchEnd: () => recordMatchEnd,
  recordMatchStart: () => recordMatchStart,
  refFromMatchId: () => refFromMatchId,
  removeCategoryDef: () => removeCategoryDef,
  removeParticipant: () => removeParticipant,
  replaceParticipants: () => replaceParticipants,
  reseed: () => reseed,
  resetLiveScoreboard: () => resetLiveScoreboard,
  roundLabel: () => roundLabel,
  runEngineTick: () => runEngineTick,
  samePath: () => samePath,
  setAreaCount: () => setAreaCount,
  setCategoryDefs: () => setCategoryDefs,
  setDisciplineMode: () => setDisciplineMode,
  setLogoUrl: () => setLogoUrl,
  setSubcategorySize: () => setSubcategorySize,
  shuffleSeeded: () => shuffleSeeded,
  sortDefaultDefs: () => sortDefaultDefs,
  stringifyParticipantsCsv: () => stringifyParticipantsCsv,
  subcategoryIdsForArea: () => subcategoryIdsForArea,
  subcategoryStatus: () => subcategoryStatus,
  treeComplete: () => treeComplete,
  treeHasProgress: () => treeHasProgress,
  updateCategoryDef: () => updateCategoryDef,
  updateEngineConfig: () => updateEngineConfig
});
module.exports = __toCommonJS(index_exports);

// ../../packages/core/src/data.ts
var BELT_ORDER = [
  "white",
  "yellow",
  "orange",
  "green",
  "blue",
  "purple",
  "brown",
  "black"
];
var BELT_LABEL_EN = {
  white: "White",
  yellow: "Yellow",
  orange: "Orange",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  brown: "Brown",
  black: "Black"
};
var BELT_ALIASES = {
  white: "white",
  blanco: "white",
  blanca: "white",
  yellow: "yellow",
  amarillo: "yellow",
  amarilla: "yellow",
  orange: "orange",
  naranja: "orange",
  green: "green",
  verde: "green",
  blue: "blue",
  azul: "blue",
  purple: "purple",
  morado: "purple",
  morada: "purple",
  violeta: "purple",
  brown: "brown",
  marron: "brown",
  "marr\xF3n": "brown",
  cafe: "brown",
  "caf\xE9": "brown",
  black: "black",
  negro: "black",
  negra: "black"
};
var AGE_RANGES = [
  "4-6",
  "7-9",
  "10-12",
  "13-15",
  "16-17",
  "adult"
];
var AGE_RANGE_LABEL = {
  "4-6": "4-6",
  "7-9": "7-9",
  "10-12": "10-12",
  "13-15": "13-15",
  "16-17": "16-17",
  adult: "Adult"
};
var DEFAULT_KEYS = {
  selectRed: "r",
  selectBlue: "a",
  add1: "1",
  add2: "2",
  add3: "3",
  senshu: "s",
  penalty: "c",
  undo: "Delete",
  pauseTimer: " ",
  addSecond: "+",
  subSecond: "-"
};
var KEY_LABELS = {
  selectRed: "Select Red competitor",
  selectBlue: "Select Blue competitor",
  add1: "Add 1 point",
  add2: "Add 2 points",
  add3: "Add 3 points",
  senshu: "Toggle advantage (Senshu)",
  penalty: "Add penalty",
  undo: "Undo modifier",
  pauseTimer: "Pause / Resume timer",
  addSecond: "Add 1 second",
  subSecond: "Subtract 1 second"
};
var KATA_DISABLED_COMMANDS = /* @__PURE__ */ new Set([
  "senshu",
  "penalty",
  "pauseTimer",
  "addSecond",
  "subSecond"
]);

// ../../packages/core/src/subcategories.ts
function emptyMatch(p1, p2) {
  return {
    p1: p1 ?? null,
    p2: p2 ?? null,
    winner: null,
    eliminated: null,
    jury: false,
    result: null
  };
}
function distributeRemainder(comps) {
  const R = comps.length;
  if (R === 0) return [];
  if (R === 1) return [{ type: "playin-orphan", competitors: comps.slice() }];
  if (R === 2) return [{ type: "series", competitors: comps.slice() }];
  if (R === 3) return [{ type: "roundrobin", competitors: comps.slice() }];
  if (R === 4) return [{ type: "standard", size: 4, competitors: comps.slice() }];
  if (R < 8)
    return [
      { type: "standard", size: 4, competitors: comps.slice(0, 4) },
      ...distributeRemainder(comps.slice(4))
    ];
  if (R === 8) return [{ type: "standard", size: 8, competitors: comps.slice() }];
  return [
    { type: "standard", size: 8, competitors: comps.slice(0, 8) },
    ...distributeRemainder(comps.slice(8))
  ];
}
function consolidatePlayinOrphans(specs) {
  const out = [];
  for (const s of specs) {
    const prev = out[out.length - 1];
    if (s.type === "playin-orphan" && prev && prev.type === "standard") {
      const promoted = prev.competitors[prev.competitors.length - 1];
      const leftover = s.competitors[0];
      out[out.length - 1] = {
        type: "playin",
        size: prev.size,
        competitors: prev.competitors.slice(0, -1).concat([null]),
        playinCompetitors: [promoted, leftover],
        fullCompetitorList: prev.competitors.concat([leftover])
      };
    } else {
      out.push(s);
    }
  }
  return out;
}
function buildSubcategorySpecs(competitors, G) {
  const N = competitors.length;
  const fullGroups = Math.floor(N / G);
  const R = N % G;
  const specs = [];
  if (R === 1 && fullGroups >= 1) {
    for (let i = 0; i < fullGroups - 1; i++) {
      specs.push({
        type: "standard",
        size: G,
        competitors: competitors.slice(i * G, (i + 1) * G)
      });
    }
    const lastGroup = competitors.slice(
      (fullGroups - 1) * G,
      fullGroups * G
    );
    const promoted = lastGroup[lastGroup.length - 1];
    const leftover2 = competitors[fullGroups * G];
    specs.push({
      type: "playin",
      size: G,
      competitors: [...lastGroup.slice(0, -1), null],
      playinCompetitors: [promoted, leftover2],
      fullCompetitorList: lastGroup.concat([leftover2])
    });
    return specs;
  }
  for (let i = 0; i < fullGroups; i++) {
    specs.push({
      type: "standard",
      size: G,
      competitors: competitors.slice(i * G, (i + 1) * G)
    });
  }
  if (R === 0) return specs;
  const leftover = competitors.slice(fullGroups * G);
  specs.push(...distributeRemainder(leftover));
  return consolidatePlayinOrphans(specs);
}
function buildStandardTree(competitors) {
  const G = competitors.length;
  const rounds = [];
  const r0 = [];
  for (let i = 0; i < G; i += 2) {
    r0.push(emptyMatch(competitors[i] ?? null, competitors[i + 1] ?? null));
  }
  rounds.push(r0);
  let prev = r0;
  while (prev.length > 1) {
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(emptyMatch(null, null));
    }
    rounds.push(next);
    prev = next;
  }
  return { rounds, champion: null };
}
function buildSeriesTree(competitors) {
  return {
    matches: [
      emptyMatch(competitors[0], competitors[1]),
      emptyMatch(competitors[0], competitors[1])
    ],
    winner: null,
    juryDecided: false
  };
}
function buildRRTree(competitors) {
  const [a, b, c] = competitors;
  return {
    matches: [
      Object.assign(emptyMatch(a, b), { pair: "ab" }),
      Object.assign(emptyMatch(a, c), { pair: "ac" }),
      Object.assign(emptyMatch(b, c), { pair: "bc" })
    ],
    rankings: null,
    winner: null,
    juryDecided: false
  };
}
function buildPlayinTree(spec) {
  const [p1, p2] = spec.playinCompetitors;
  return {
    extra: emptyMatch(p1, p2),
    bracket: buildStandardTree(spec.competitors)
  };
}
function buildTreeFromSpec(spec) {
  if (spec.type === "standard") return buildStandardTree(spec.competitors);
  if (spec.type === "playin") return buildPlayinTree(spec);
  if (spec.type === "series")
    return buildSeriesTree(spec.competitors);
  if (spec.type === "roundrobin")
    return buildRRTree(spec.competitors);
  return buildStandardTree(spec.competitors);
}
function buildSubcategory(spec, idx, catId, mode) {
  const id = `${catId}-sub-${idx + 1}`;
  let label;
  let tag;
  if (spec.type === "standard") {
    label = `Group ${idx + 1}`;
    tag = "";
  } else if (spec.type === "playin") {
    label = `Group ${idx + 1} \xB7 Play-in`;
    tag = "playin";
  } else if (spec.type === "series") {
    label = "2-Match Series";
    tag = "series";
  } else if (spec.type === "roundrobin") {
    label = "Round Robin";
    tag = "rr";
  } else {
    label = "Group";
    tag = "";
  }
  const competitors = spec.fullCompetitorList ?? spec.competitors.filter(Boolean);
  const trees = {};
  const disciplines = mode === "both" ? ["combat", "kata"] : [mode];
  for (const disc of disciplines) {
    trees[disc] = buildTreeFromSpec(spec);
  }
  return {
    id,
    categoryId: catId,
    type: spec.type,
    label,
    tag,
    competitors,
    trees,
    activeDiscipline: disciplines[0]
  };
}
function rebuildCategorySubcategories(cat, settings) {
  const specs = buildSubcategorySpecs(cat.competitors, settings.subcategorySize);
  cat.subcategories = specs.map(
    (spec, idx) => buildSubcategory(spec, idx, cat.id, settings.disciplineMode)
  );
  cat.activeSubcategoryId = cat.subcategories[0]?.id ?? null;
  cat.champion = {};
}

// ../../packages/core/src/category-defs.ts
function newCategoryDefId() {
  return "cat_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
function categoryDefMatches(def, p) {
  if (def.belts.length > 0 && !def.belts.includes(p.beltColor)) return false;
  if (p.age < def.minAge) return false;
  if (def.maxAge !== null && p.age > def.maxAge) return false;
  return true;
}
function findCategoryForParticipant(defs, p) {
  for (const def of defs) {
    if (categoryDefMatches(def, p)) return def;
  }
  return null;
}
function describeCategoryDef(def) {
  const ageLabel = def.maxAge === null ? `${def.minAge}+` : `${def.minAge}\u2013${def.maxAge}`;
  const beltLabel = def.belts.length === 0 ? "Any belt" : def.belts.join("/");
  return `${def.name} \xB7 ${beltLabel} \xB7 ${ageLabel}`;
}
function defaultCategoryDefs() {
  return [
    {
      id: "cat_yellow_4_6",
      name: "Yellow 4-6",
      belts: ["yellow"],
      minAge: 4,
      maxAge: 6
    },
    {
      id: "cat_brown_10_12",
      name: "Brown 10-12",
      belts: ["brown"],
      minAge: 10,
      maxAge: 12
    },
    {
      id: "cat_black_13_15",
      name: "Black 13-15",
      belts: ["black"],
      minAge: 13,
      maxAge: 15
    },
    {
      id: "cat_adult_open",
      name: "Adult Open",
      belts: [],
      // empty = any belt
      minAge: 16,
      maxAge: null
    }
  ];
}

// ../../packages/core/src/seeding.ts
function mulberry32(seed) {
  let s = seed >>> 0;
  return function rand() {
    s = s + 1831565813 >>> 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function generateRandomSeed() {
  return Math.floor(Math.random() * 2147483647);
}
function shuffleSeeded(items, seed) {
  const rand = mulberry32(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ../../packages/core/src/categories.ts
function ageRangeFor(age) {
  if (age <= 6) return "4-6";
  if (age <= 9) return "7-9";
  if (age <= 12) return "10-12";
  if (age <= 15) return "13-15";
  if (age <= 17) return "16-17";
  return "adult";
}
function categoryIdFor(belt, ar) {
  return `${belt}-${ar}`;
}
function categoryNameFor(belt, ar) {
  const beltLabel = BELT_LABEL_EN[belt];
  if (ar === "adult") return `${beltLabel} Adult`;
  return `${beltLabel} ${ar}`;
}
function fullName(p) {
  return `${p.nombre} ${p.apellido}`.trim();
}
function primaryBelt(def) {
  return def.belts[0] ?? "white";
}
function ageRangeFromDef(def) {
  if (def.maxAge === null) return "adult";
  return ageRangeFor(def.maxAge);
}
function rebuildCategoriesFromParticipants(participants, settings, defs, opts) {
  const buckets = /* @__PURE__ */ new Map();
  const unassigned = [];
  for (const p of participants) {
    const def = findCategoryForParticipant(defs, p);
    if (!def) {
      unassigned.push(p);
      continue;
    }
    const arr = buckets.get(def.id);
    if (arr) arr.push(p);
    else buckets.set(def.id, [p]);
  }
  const categories = {};
  const orderedDefs = defs.slice();
  for (const def of orderedDefs) {
    const bucket = buckets.get(def.id);
    if (!bucket || bucket.length === 0) continue;
    const seeded = shuffleSeeded(bucket, opts.seed ^ hashString(def.id));
    const cat = {
      id: def.id,
      name: def.name,
      beltColor: primaryBelt(def),
      ageRange: ageRangeFromDef(def),
      competitors: seeded.map(fullName),
      subcategories: [],
      activeSubcategoryId: null,
      champion: {}
    };
    rebuildCategorySubcategories(cat, settings);
    categories[def.id] = cat;
  }
  const orderedDefIds = orderedDefs.filter((d) => categories[d.id]).map((d) => d.id);
  const categoryOrder = orderedDefIds;
  const prev = opts.prevActiveCategoryId ?? null;
  const activeCategoryId = prev && categories[prev] ? prev : categoryOrder[0] ?? null;
  return { categories, categoryOrder, activeCategoryId, unassigned };
}
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function sortDefaultDefs(defs) {
  return defs.slice().sort((a, b) => {
    const ba = BELT_ORDER.indexOf(primaryBelt(a));
    const bb = BELT_ORDER.indexOf(primaryBelt(b));
    if (ba !== bb) return ba - bb;
    if (a.minAge !== b.minAge) return a.minAge - b.minAge;
    return a.name.localeCompare(b.name);
  });
}

// ../../packages/core/src/csv.ts
var REQUIRED = ["nombre", "apellido", "beltColor", "age"];
function parseParticipantsCsv(text) {
  const out = [];
  const errors = [];
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return { participants: out, errors };
  const headerLine = lines[0]?.trim() ?? "";
  const header = splitLine(headerLine).map((h) => h.toLowerCase());
  const idx = {
    nombre: header.indexOf("nombre"),
    apellido: header.indexOf("apellido"),
    beltColor: header.indexOf("beltcolor"),
    age: header.indexOf("age")
  };
  for (const k of REQUIRED) {
    const got = idx[k];
    if (got < 0) {
      errors.push({ line: 1, message: `Missing required column: ${k}` });
    }
  }
  if (errors.length > 0) return { participants: out, errors };
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || !raw.trim()) continue;
    const cols = splitLine(raw);
    const nombre = (cols[idx.nombre] ?? "").trim();
    const apellido = (cols[idx.apellido] ?? "").trim();
    const beltRaw = (cols[idx.beltColor] ?? "").trim().toLowerCase();
    const ageRaw = (cols[idx.age] ?? "").trim();
    if (!nombre || !apellido) {
      errors.push({ line: i + 1, message: "nombre and apellido are required" });
      continue;
    }
    const belt = BELT_ALIASES[beltRaw];
    if (!belt) {
      errors.push({
        line: i + 1,
        message: `Unknown beltColor: "${beltRaw}"`
      });
      continue;
    }
    const age = Number.parseInt(ageRaw, 10);
    if (!Number.isFinite(age) || age < 3 || age > 99) {
      errors.push({
        line: i + 1,
        message: `Invalid age: "${ageRaw}"`
      });
      continue;
    }
    out.push({ nombre, apellido, beltColor: belt, age });
  }
  return { participants: out, errors };
}
function splitLine(line) {
  const out = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  out.push(cur);
  return out;
}
function stringifyParticipantsCsv(participants) {
  const lines = ["nombre,apellido,beltColor,age"];
  for (const p of participants) {
    lines.push(
      [p.nombre, p.apellido, p.beltColor, p.age].map(csvField).join(",")
    );
  }
  return lines.join("\n") + "\n";
}
function csvField(v) {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function newParticipantId() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

// ../../packages/core/src/areas.ts
function areaLabel(idx) {
  return `Area ${idx + 1}`;
}
function buildAreaPlan(input, existing = {}) {
  const n = Math.max(1, Math.min(10, input.areaCount | 0));
  const areas = Array.from({ length: n }, (_, i) => ({
    index: i,
    label: areaLabel(i),
    subcategoryIds: [],
    load: 0
  }));
  const assignments = {};
  const claimed = /* @__PURE__ */ new Set();
  for (const catId of input.categoryOrder) {
    const cat = input.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      const target = existing[sub.id];
      if (typeof target === "number" && target >= 0 && target < n) {
        areas[target].subcategoryIds.push(sub.id);
        areas[target].load++;
        assignments[sub.id] = target;
        claimed.add(sub.id);
      }
    }
  }
  const groups = [];
  for (const catId of input.categoryOrder) {
    const cat = input.categories[catId];
    if (!cat) continue;
    const subIds = cat.subcategories.map((s) => s.id).filter((id) => !claimed.has(id));
    if (subIds.length > 0) groups.push({ catId, subIds });
  }
  groups.sort((a, b) => b.subIds.length - a.subIds.length);
  const total = groups.reduce((acc, g) => acc + g.subIds.length, 0) + Object.keys(assignments).length;
  const fairShare = Math.ceil(total / n);
  function lightestArea() {
    let best = areas[0];
    for (const a of areas) if (a.load < best.load) best = a;
    return best;
  }
  for (const group of groups) {
    const target = areas.slice().sort((a, b) => a.load - b.load).find((a) => a.load + group.subIds.length <= fairShare);
    if (target) {
      for (const id of group.subIds) {
        target.subcategoryIds.push(id);
        target.load++;
        assignments[id] = target.index;
      }
      continue;
    }
    for (const id of group.subIds) {
      const a = lightestArea();
      a.subcategoryIds.push(id);
      a.load++;
      assignments[id] = a.index;
    }
  }
  return { areas, assignments };
}
function subcategoryIdsForArea(state, assignments, areaIndex) {
  const out = [];
  for (const catId of state.tournament.categoryOrder) {
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      if (assignments[sub.id] === areaIndex) out.push(sub.id);
    }
  }
  return out;
}
function categoryHasArea(category, assignments, areaIndex) {
  return category.subcategories.some((s) => assignments[s.id] === areaIndex);
}

// ../../packages/core/src/winner.ts
function computeCombatWinner(m, pointDifferenceThreshold) {
  const blueOut = m.blueEliminated || m.bluePenalties >= 5;
  const redOut = m.redEliminated || m.redPenalties >= 5;
  if (blueOut && !redOut) return "red";
  if (redOut && !blueOut) return "blue";
  if (blueOut && redOut) return null;
  if (typeof pointDifferenceThreshold === "number" && pointDifferenceThreshold > 0) {
    const diff = m.bluePoints - m.redPoints;
    if (diff >= pointDifferenceThreshold) return "blue";
    if (-diff >= pointDifferenceThreshold) return "red";
  }
  if (m.bluePoints > m.redPoints) return "blue";
  if (m.redPoints > m.bluePoints) return "red";
  if (m.blueAdvantage && !m.redAdvantage) return "blue";
  if (m.redAdvantage && !m.blueAdvantage) return "red";
  return null;
}
function computeKataWinner(m) {
  if (m.blueEliminated && !m.redEliminated) return "red";
  if (m.redEliminated && !m.blueEliminated) return "blue";
  if (m.bluePoints > m.redPoints) return "blue";
  if (m.redPoints > m.bluePoints) return "red";
  return null;
}
function computeWinner(m, pointDifferenceThreshold) {
  return m.discipline === "kata" ? computeKataWinner(m) : computeCombatWinner(m, pointDifferenceThreshold);
}

// ../../packages/core/src/state.ts
var STORAGE_KEY = "karate-state-v5";
var TIMER_OWNER_KEY = "karate-timer-owner-v5";
var CHANNEL_NAME = "karate-state-v5";
function buildInitialState() {
  const settings = {
    subcategorySize: 4,
    disciplineMode: "combat",
    areaCount: 1,
    pointDifference: 8
  };
  return {
    tournament: {
      settings,
      categoryDefs: defaultCategoryDefs(),
      participants: [],
      categories: {},
      categoryOrder: [],
      activeCategoryId: null,
      areaAssignments: {},
      meta: {
        seed: generateRandomSeed(),
        logoUrl: null
      }
    },
    match: {
      blueName: "",
      redName: "",
      bluePoints: 0,
      redPoints: 0,
      bluePenalties: 0,
      redPenalties: 0,
      blueAdvantage: false,
      redAdvantage: false,
      blueEliminated: false,
      redEliminated: false,
      discipline: null,
      activeMatchRef: null
    },
    timer: {
      duration: 120,
      remaining: 120,
      running: false,
      finished: false
    },
    settings: {
      defaultDuration: 120,
      keys: { ...DEFAULT_KEYS }
    },
    jury: null,
    engine: void 0
  };
}
function loadState(storage) {
  if (!storage) return buildInitialState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.tournament || !parsed.tournament.settings || !Array.isArray(parsed.tournament.participants) || !parsed.match || !parsed.timer || !parsed.settings) {
      return buildInitialState();
    }
    parsed.settings.keys = {
      ...DEFAULT_KEYS,
      ...parsed.settings.keys ?? {}
    };
    if (typeof parsed.jury === "undefined") parsed.jury = null;
    if (!Array.isArray(parsed.tournament.categoryDefs) || parsed.tournament.categoryDefs.length === 0) {
      parsed.tournament.categoryDefs = defaultCategoryDefs();
    }
    if (typeof parsed.tournament.settings.areaCount !== "number") {
      parsed.tournament.settings.areaCount = 1;
    }
    if (typeof parsed.tournament.settings.pointDifference === "undefined") {
      parsed.tournament.settings.pointDifference = 8;
    }
    if (!parsed.tournament.areaAssignments || typeof parsed.tournament.areaAssignments !== "object") {
      parsed.tournament.areaAssignments = {};
    }
    if (!parsed.tournament.meta || typeof parsed.tournament.meta !== "object") {
      parsed.tournament.meta = { seed: generateRandomSeed(), logoUrl: null };
    } else {
      if (typeof parsed.tournament.meta.seed !== "number") parsed.tournament.meta.seed = generateRandomSeed();
      if (typeof parsed.tournament.meta.logoUrl === "undefined") parsed.tournament.meta.logoUrl = null;
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}
function getCategory(state, catId) {
  return state.tournament.categories[catId] ?? null;
}
function getSubcategory(state, catId, subId) {
  const cat = getCategory(state, catId);
  if (!cat) return null;
  return cat.subcategories.find((s) => s.id === subId) ?? null;
}
function getMatchByRef(state, ref) {
  if (!ref) return null;
  const sub = getSubcategory(state, ref.categoryId, ref.subcategoryId);
  if (!sub) return null;
  const tree = sub.trees[ref.discipline];
  if (!tree) return null;
  const path = ref.path;
  if (sub.type === "standard") {
    const t = tree;
    if (path.kind !== "std") return null;
    return t.rounds[path.round]?.[path.idx] ?? null;
  }
  if (sub.type === "playin") {
    const t = tree;
    if (path.kind === "playin") return t.extra;
    if (path.kind !== "std") return null;
    return t.bracket.rounds[path.round]?.[path.idx] ?? null;
  }
  if (sub.type === "series") {
    const t = tree;
    if (path.kind !== "series") return null;
    return t.matches[path.idx] ?? null;
  }
  if (sub.type === "roundrobin") {
    const t = tree;
    if (path.kind !== "rr") return null;
    return t.matches.find((m) => m.pair === path.pair) ?? null;
  }
  return null;
}
function treeComplete(type, tree) {
  if (type === "standard") return !!tree.champion;
  if (type === "playin") return !!tree.bracket.champion;
  if (type === "series") return !!tree.winner;
  if (type === "roundrobin") return !!tree.winner;
  return false;
}
function treeHasProgress(type, tree) {
  if (type === "standard")
    return tree.rounds.some(
      (r) => r.some((m) => m.winner)
    );
  if (type === "playin") {
    const t = tree;
    if (t.extra.winner) return true;
    return t.bracket.rounds.some((r) => r.some((m) => m.winner));
  }
  if (type === "series" || type === "roundrobin")
    return tree.matches.some((m) => m.winner);
  return false;
}
function subcategoryStatus(sub) {
  const trees = Object.values(sub.trees);
  if (trees.length === 0) return "pending";
  const allComplete = trees.every((t) => treeComplete(sub.type, t));
  if (allComplete) return "complete";
  return trees.some((t) => treeHasProgress(sub.type, t)) ? "in-progress" : "pending";
}
function rebuildAllSubcategories(state) {
  const result = rebuildCategoriesFromParticipants(
    state.tournament.participants,
    state.tournament.settings,
    state.tournament.categoryDefs,
    {
      seed: state.tournament.meta.seed,
      prevActiveCategoryId: state.tournament.activeCategoryId
    }
  );
  state.tournament.categories = result.categories;
  state.tournament.categoryOrder = result.categoryOrder;
  state.tournament.activeCategoryId = result.activeCategoryId;
  const validSubIds = /* @__PURE__ */ new Set();
  for (const catId of result.categoryOrder) {
    const cat = result.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) validSubIds.add(sub.id);
  }
  const next = {};
  for (const [id, idx] of Object.entries(state.tournament.areaAssignments)) {
    if (validSubIds.has(id) && idx < state.tournament.settings.areaCount) {
      next[id] = idx;
    }
  }
  state.tournament.areaAssignments = buildAreaPlan(
    {
      categoryOrder: state.tournament.categoryOrder,
      categories: state.tournament.categories,
      areaCount: state.tournament.settings.areaCount
    },
    next
  ).assignments;
}
function reseed(state, seed) {
  const next = typeof seed === "number" ? seed : generateRandomSeed();
  state.tournament.meta.seed = next;
  rebuildAllSubcategories(state);
  resetLiveScoreboard(state);
  state.jury = null;
  return next;
}
function setCategoryDefs(state, defs) {
  state.tournament.categoryDefs = defs.slice();
  rebuildAllSubcategories(state);
}
function addCategoryDef(state, def) {
  state.tournament.categoryDefs = [...state.tournament.categoryDefs, def];
  rebuildAllSubcategories(state);
}
function updateCategoryDef(state, def) {
  state.tournament.categoryDefs = state.tournament.categoryDefs.map(
    (d) => d.id === def.id ? def : d
  );
  rebuildAllSubcategories(state);
}
function removeCategoryDef(state, defId) {
  state.tournament.categoryDefs = state.tournament.categoryDefs.filter(
    (d) => d.id !== defId
  );
  rebuildAllSubcategories(state);
}
function setSubcategorySize(state, size) {
  state.tournament.settings.subcategorySize = size;
  rebuildAllSubcategories(state);
  resetLiveScoreboard(state);
  state.jury = null;
}
function setDisciplineMode(state, mode) {
  state.tournament.settings.disciplineMode = mode;
  rebuildAllSubcategories(state);
  resetLiveScoreboard(state);
  state.jury = null;
}
function setAreaCount(state, count) {
  const n = Math.max(1, Math.min(10, Math.floor(count)));
  state.tournament.settings.areaCount = n;
  const filtered = {};
  for (const [id, idx] of Object.entries(state.tournament.areaAssignments)) {
    if (idx < n) filtered[id] = idx;
  }
  state.tournament.areaAssignments = buildAreaPlan(
    {
      categoryOrder: state.tournament.categoryOrder,
      categories: state.tournament.categories,
      areaCount: n
    },
    filtered
  ).assignments;
}
function assignSubcategoryToArea(state, subcategoryId, areaIndex) {
  const n = state.tournament.settings.areaCount;
  if (areaIndex < 0 || areaIndex >= n) return;
  state.tournament.areaAssignments = {
    ...state.tournament.areaAssignments,
    [subcategoryId]: areaIndex
  };
}
function setLogoUrl(state, url) {
  state.tournament.meta.logoUrl = url;
}
function replaceParticipants(state, list) {
  state.tournament.participants = list.map((p) => ({
    ...p,
    id: newParticipantId()
  }));
  rebuildAllSubcategories(state);
  resetLiveScoreboard(state);
  state.jury = null;
}
function addParticipant(state, p) {
  state.tournament.participants.push({ ...p, id: newParticipantId() });
  rebuildAllSubcategories(state);
  resetLiveScoreboard(state);
  state.jury = null;
}
function removeParticipant(state, id) {
  state.tournament.participants = state.tournament.participants.filter(
    (p) => p.id !== id
  );
  rebuildAllSubcategories(state);
  resetLiveScoreboard(state);
  state.jury = null;
}
function captureSb(m) {
  return {
    p1: {
      name: m.blueName,
      points: m.bluePoints,
      penalties: m.bluePenalties,
      advantage: m.blueAdvantage
    },
    p2: {
      name: m.redName,
      points: m.redPoints,
      penalties: m.redPenalties,
      advantage: m.redAdvantage
    }
  };
}
function resetLiveScoreboard(state) {
  state.match.blueName = "";
  state.match.redName = "";
  state.match.bluePoints = 0;
  state.match.redPoints = 0;
  state.match.bluePenalties = 0;
  state.match.redPenalties = 0;
  state.match.blueAdvantage = false;
  state.match.redAdvantage = false;
  state.match.blueEliminated = false;
  state.match.redEliminated = false;
  state.match.discipline = null;
  state.match.activeMatchRef = null;
  state.timer.duration = state.settings.defaultDuration;
  state.timer.remaining = state.settings.defaultDuration;
  state.timer.running = false;
  state.timer.finished = false;
}
function loadMatchToScoreboardImpl(state, ref) {
  const m = getMatchByRef(state, ref);
  if (!m || !m.p1 || !m.p2 || m.winner) return false;
  state.match.blueName = m.p1;
  state.match.redName = m.p2;
  state.match.bluePoints = 0;
  state.match.redPoints = 0;
  state.match.bluePenalties = 0;
  state.match.redPenalties = 0;
  state.match.blueAdvantage = false;
  state.match.redAdvantage = false;
  state.match.blueEliminated = false;
  state.match.redEliminated = false;
  state.match.discipline = ref.discipline;
  state.match.activeMatchRef = ref;
  state.timer.duration = state.settings.defaultDuration;
  state.timer.remaining = state.settings.defaultDuration;
  state.timer.running = false;
  state.timer.finished = false;
  return true;
}
function propagateBracketWinner(bracket, round, idx, winnerName) {
  if (round + 1 < bracket.rounds.length) {
    const next = bracket.rounds[round + 1][Math.floor(idx / 2)];
    if (idx % 2 === 0) next.p1 = winnerName;
    else next.p2 = winnerName;
  } else {
    bracket.champion = winnerName;
  }
}
function finalizeMatchByRef(state, ref, winnerName, loserName, juryUsed) {
  const sub = getSubcategory(state, ref.categoryId, ref.subcategoryId);
  if (!sub) return;
  const tree = sub.trees[ref.discipline];
  if (!tree) return;
  const m = getMatchByRef(state, ref);
  if (!m) return;
  m.winner = winnerName;
  m.eliminated = loserName;
  m.jury = juryUsed;
  m.result = captureSb(state.match);
  if (sub.type === "standard") {
    if (ref.path.kind === "std") {
      propagateBracketWinner(
        tree,
        ref.path.round,
        ref.path.idx,
        winnerName
      );
    }
  } else if (sub.type === "playin") {
    const t = tree;
    if (ref.path.kind === "playin") {
      const r0 = t.bracket.rounds[0];
      r0[r0.length - 1].p2 = winnerName;
    } else if (ref.path.kind === "std") {
      propagateBracketWinner(
        t.bracket,
        ref.path.round,
        ref.path.idx,
        winnerName
      );
    }
  } else if (sub.type === "series") {
    const t = tree;
    if (t.matches.every((mm) => mm.winner)) {
      finalizeSeries(state, sub, ref.discipline);
    }
  } else if (sub.type === "roundrobin") {
    const t = tree;
    if (t.matches.every((mm) => mm.winner)) {
      finalizeRR(state, sub, ref.discipline);
    }
  }
  resetLiveScoreboard(state);
}
function finalizeSeries(state, sub, discipline) {
  const tree = sub.trees[discipline];
  const [a, b] = sub.competitors;
  const winsA = tree.matches.filter((m) => m.winner === a).length;
  const winsB = tree.matches.filter((m) => m.winner === b).length;
  if (winsA === 2) {
    tree.winner = a;
    return null;
  }
  if (winsB === 2) {
    tree.winner = b;
    return null;
  }
  const totals = { [a]: 0, [b]: 0 };
  const pens = { [a]: 0, [b]: 0 };
  const sens = { [a]: 0, [b]: 0 };
  for (const m of tree.matches) {
    if (!m.result) continue;
    totals[m.p1] += m.result.p1.points;
    totals[m.p2] += m.result.p2.points;
    pens[m.p1] += m.result.p1.penalties;
    pens[m.p2] += m.result.p2.penalties;
    if (m.result.p1.advantage) sens[m.p1]++;
    if (m.result.p2.advantage) sens[m.p2]++;
  }
  if (totals[a] !== totals[b]) {
    tree.winner = totals[a] > totals[b] ? a : b;
    return null;
  }
  if (pens[a] !== pens[b]) {
    tree.winner = pens[a] < pens[b] ? a : b;
    return null;
  }
  if (sens[a] !== sens[b]) {
    tree.winner = sens[a] > sens[b] ? a : b;
    return null;
  }
  state.jury = {
    competitors: [a, b],
    context: {
      kind: "series-final",
      subRef: {
        categoryId: sub.categoryId,
        subcategoryId: sub.id,
        discipline
      }
    }
  };
  return "jury";
}
function finalizeRR(state, sub, discipline) {
  const tree = sub.trees[discipline];
  const comps = sub.competitors;
  const stats = {};
  for (const n of comps)
    stats[n] = { name: n, w: 0, l: 0, pts: 0, pen: 0, senshu: 0 };
  for (const m of tree.matches) {
    if (!m.result) continue;
    stats[m.p1].pts += m.result.p1.points;
    stats[m.p2].pts += m.result.p2.points;
    stats[m.p1].pen += m.result.p1.penalties;
    stats[m.p2].pen += m.result.p2.penalties;
    if (m.result.p1.advantage) stats[m.p1].senshu++;
    if (m.result.p2.advantage) stats[m.p2].senshu++;
    if (m.winner === m.p1) {
      stats[m.p1].w++;
      stats[m.p2].l++;
    } else if (m.winner === m.p2) {
      stats[m.p2].w++;
      stats[m.p1].l++;
    }
  }
  const ranked = comps.map((n) => stats[n]).sort((x, y) => {
    if (y.w !== x.w) return y.w - x.w;
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (x.pen !== y.pen) return x.pen - y.pen;
    if (y.senshu !== x.senshu) return y.senshu - x.senshu;
    return 0;
  });
  tree.rankings = ranked;
  const top = ranked[0];
  const tied = ranked.filter(
    (r) => r.w === top.w && r.pts === top.pts && r.pen === top.pen && r.senshu === top.senshu
  );
  if (tied.length > 1) {
    state.jury = {
      competitors: [tied[0].name, tied[1].name],
      context: {
        kind: "rr-final",
        subRef: {
          categoryId: sub.categoryId,
          subcategoryId: sub.id,
          discipline
        }
      }
    };
    return "jury";
  }
  tree.winner = top.name;
  return null;
}
function describeRefLabel(state, ref) {
  const sub = getSubcategory(state, ref.categoryId, ref.subcategoryId);
  if (!sub) return "?";
  const d = Object.keys(sub.trees).length > 1 ? ref.discipline.charAt(0).toUpperCase() + " \xB7 " : "";
  if (ref.path.kind === "playin") return d + "Play-in \xB7 " + sub.label;
  if (ref.path.kind === "series")
    return d + sub.label + " M" + (ref.path.idx + 1);
  if (ref.path.kind === "rr") {
    const map = { ab: "A vs B", ac: "A vs C", bc: "B vs C" };
    return d + sub.label + " \xB7 " + map[ref.path.pair];
  }
  if (ref.path.kind === "std") {
    const tree = sub.type === "playin" ? sub.trees[ref.discipline].bracket : sub.trees[ref.discipline];
    const total = tree.rounds.length;
    return d + sub.label + " \xB7 " + roundLabel(ref.path.round, total) + " M" + (ref.path.idx + 1);
  }
  return d + sub.label;
}
function roundLabel(roundIdx, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Quarterfinal";
  if (fromEnd === 3) return "Round of 16";
  return `Round ${roundIdx + 1}`;
}
function samePath(a, b) {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "std" && b.kind === "std")
    return a.round === b.round && a.idx === b.idx;
  if (a.kind === "series" && b.kind === "series") return a.idx === b.idx;
  if (a.kind === "rr" && b.kind === "rr") return a.pair === b.pair;
  if (a.kind === "playin" && b.kind === "playin") return true;
  return false;
}

// ../../packages/core/src/nav.ts
function findNextMatch(state, from) {
  const order = state.tournament.categoryOrder;
  const startCatIdx = Math.max(0, order.indexOf(from.categoryId));
  for (let i = 0; i < order.length; i++) {
    const catId = order[(startCatIdx + i) % order.length];
    if (!catId) continue;
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    const startSubIdx = i === 0 ? Math.max(0, cat.subcategories.findIndex((s) => s.id === from.subcategoryId)) : 0;
    for (let j = 0; j < cat.subcategories.length; j++) {
      const sub = cat.subcategories[(startSubIdx + j) % cat.subcategories.length];
      if (!sub) continue;
      const sameSub = sub.id === from.subcategoryId && i === 0 && j === 0;
      const found = findInSubcategory(sub, sameSub ? from : null);
      if (found) {
        return {
          categoryId: catId,
          subcategoryId: sub.id,
          discipline: found.discipline,
          path: found.path
        };
      }
    }
  }
  return null;
}
function findInSubcategory(sub, fromRef) {
  const disciplines = Object.keys(sub.trees);
  if (fromRef) {
    disciplines.sort(
      (a, b) => a === fromRef.discipline ? -1 : b === fromRef.discipline ? 1 : 0
    );
  } else {
    disciplines.sort(
      (a, b) => a === sub.activeDiscipline ? -1 : b === sub.activeDiscipline ? 1 : 0
    );
  }
  for (let di = 0; di < disciplines.length; di++) {
    const d = disciplines[di];
    const tree = sub.trees[d];
    if (!tree) continue;
    const isPrimary = !!fromRef && di === 0;
    const path = walkTreeForNextMatch(sub, tree, isPrimary ? fromRef : null);
    if (path) return { discipline: d, path };
  }
  return null;
}
function walkTreeForNextMatch(sub, tree, fromRef) {
  if (sub.type === "standard") {
    return walkStandardTree(tree, fromRef);
  }
  if (sub.type === "playin") {
    const t = tree;
    if ((!fromRef || fromRef.path.kind !== "playin" && fromRef.path.kind !== "std") && isPlayable(t.extra)) {
      return { kind: "playin" };
    }
    if (!fromRef || fromRef.path.kind === "playin") {
      if (isPlayable(t.extra)) return { kind: "playin" };
    }
    return walkStandardTree(t.bracket, fromRef);
  }
  if (sub.type === "series") {
    const t = tree;
    const startIdx = fromRef && fromRef.path.kind === "series" ? fromRef.path.idx + 1 : 0;
    for (let i = startIdx; i < t.matches.length; i++) {
      if (isPlayable(t.matches[i])) return { kind: "series", idx: i };
    }
    if (!fromRef || fromRef.path.kind !== "series") {
      for (let i = 0; i < t.matches.length; i++) {
        if (isPlayable(t.matches[i])) return { kind: "series", idx: i };
      }
    }
    return null;
  }
  if (sub.type === "roundrobin") {
    const t = tree;
    const order = ["ab", "ac", "bc"];
    const startIdx = fromRef && fromRef.path.kind === "rr" ? Math.max(0, order.indexOf(fromRef.path.pair) + 1) : 0;
    for (let i = startIdx; i < order.length; i++) {
      const pair = order[i];
      const m = t.matches.find((mm) => mm.pair === pair);
      if (m && isPlayable(m)) return { kind: "rr", pair };
    }
    if (!fromRef || fromRef.path.kind !== "rr") {
      for (const pair of order) {
        const m = t.matches.find((mm) => mm.pair === pair);
        if (m && isPlayable(m)) return { kind: "rr", pair };
      }
    }
    return null;
  }
  return null;
}
function walkStandardTree(tree, fromRef) {
  const startRound = fromRef && fromRef.path.kind === "std" ? fromRef.path.round : 0;
  const startIdx = fromRef && fromRef.path.kind === "std" ? fromRef.path.idx + 1 : 0;
  for (let r = startRound; r < tree.rounds.length; r++) {
    const round = tree.rounds[r];
    const begin = r === startRound ? startIdx : 0;
    for (let i = begin; i < round.length; i++) {
      if (isPlayable(round[i])) return { kind: "std", round: r, idx: i };
    }
  }
  if (tree.thirdPlace && isPlayable(tree.thirdPlace)) {
    return { kind: "3rd" };
  }
  return null;
}
function isPlayable(m) {
  return !!m.p1 && !!m.p2 && !m.winner;
}
function allMatchesComplete(state) {
  for (const catId of state.tournament.categoryOrder) {
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    if (cat.subcategories.length === 0) continue;
    for (const sub of cat.subcategories) {
      if (subcategoryStatus(sub) !== "complete") return false;
    }
  }
  return true;
}

// ../../packages/core/src/mock-tournament.ts
var FIRST_NAMES_M = [
  "Alejandro",
  "Mateo",
  "Diego",
  "Santiago",
  "Andr\xE9s",
  "Luis",
  "Sebasti\xE1n",
  "Gabriel",
  "Tom\xE1s",
  "Joaqu\xEDn",
  "Daniel",
  "Hugo",
  "Iv\xE1n",
  "Bruno",
  "Emilio",
  "Felipe",
  "Adri\xE1n",
  "Marcos",
  "Nicol\xE1s",
  "Roberto",
  "Pablo",
  "Carlos",
  "Manuel",
  "Fernando",
  "Javier",
  "Eduardo",
  "Leonardo",
  "Esteban"
];
var FIRST_NAMES_F = [
  "Sof\xEDa",
  "Valentina",
  "Camila",
  "Luc\xEDa",
  "Mariana",
  "Daniela",
  "Isabella",
  "Renata",
  "Emilia",
  "Paula",
  "Andrea",
  "Carolina",
  "Natalia",
  "Gabriela",
  "Adriana",
  "Patricia",
  "Beatriz",
  "Lorena",
  "Cristina",
  "Elena",
  "Marina",
  "Alicia",
  "Rosa",
  "Pilar",
  "In\xE9s",
  "Clara",
  "Julia"
];
var SURNAMES = [
  "Garc\xEDa",
  "Rodr\xEDguez",
  "Mart\xEDnez",
  "Hern\xE1ndez",
  "L\xF3pez",
  "Gonz\xE1lez",
  "P\xE9rez",
  "S\xE1nchez",
  "Ram\xEDrez",
  "Torres",
  "Flores",
  "Rivera",
  "G\xF3mez",
  "D\xEDaz",
  "Cruz",
  "Morales",
  "Reyes",
  "Guti\xE9rrez",
  "Ortiz",
  "Ch\xE1vez",
  "Ramos",
  "Mendoza",
  "Vargas",
  "Castillo",
  "Jim\xE9nez",
  "Romero",
  "\xC1lvarez",
  "Moreno",
  "Mu\xF1oz",
  "Aguilar",
  "Vega",
  "Navarro",
  "Silva",
  "Soto",
  "Pe\xF1a",
  "Cort\xE9s",
  "Luna",
  "Cabrera",
  "R\xEDos",
  "Salazar",
  "C\xE1rdenas",
  "Valdez"
];
function pick(arr, i) {
  return arr[i % arr.length];
}
function buildCohort(beltKey, ageMin, ageMax, count, startSeed) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const seed = startSeed + i;
    const female = i % 2 === 0;
    const first = pick(female ? FIRST_NAMES_F : FIRST_NAMES_M, seed * 7);
    const sa = pick(SURNAMES, seed * 11 + 3);
    const sb = pick(SURNAMES, seed * 13 + 19);
    const age = ageMax === ageMin ? ageMin : ageMin + seed * 17 % (ageMax - ageMin + 1);
    out.push({
      id: newParticipantId(),
      nombre: first,
      apellido: `${sa} ${sb}`,
      beltColor: beltKey,
      age
    });
  }
  return out;
}
function generateMockTournament() {
  const defs = defaultCategoryDefs();
  const participants = [
    ...buildCohort("yellow", 4, 6, 45, 100),
    ...buildCohort("brown", 10, 12, 47, 200),
    ...buildCohort("black", 13, 15, 43, 300),
    ...buildCohort("black", 16, 35, 48, 400)
    // Adult Open — primarily black belts in this mock
  ];
  return { categoryDefs: defs, participants };
}

// ../../packages/core/src/engine-types.ts
var DEFAULT_ENGINE_CONFIG = {
  avgMatchDurationSeconds: 180,
  delayThreshold: 0.85,
  minRestSeconds: 120,
  scoreContinuityBonus: 60,
  scoreDelayPenalty: -50,
  scoreAdjacencyBonus: 30,
  scoreCriticalPathBonus: 20,
  scoreAgingBonus: 15,
  scoreFreeAreaBonus: 40,
  scoreRestViolationPenalty: -80,
  interleaveSearchRadius: 1
};

// ../../packages/core/src/engine.ts
function matchIdFromRef(ref) {
  const { categoryId, subcategoryId, discipline, path } = ref;
  const base = `${categoryId}::${subcategoryId}::${discipline}`;
  switch (path.kind) {
    case "std":
      return `${base}::std::r${path.round}::i${path.idx}`;
    case "playin":
      return `${base}::playin`;
    case "series":
      return `${base}::series::m${path.idx}`;
    case "rr":
      return `${base}::rr::${path.pair}`;
    case "3rd":
      return `${base}::3rd`;
  }
}
function refFromMatchId(id) {
  const parts = id.split("::");
  if (parts.length < 4) return null;
  const [categoryId, subcategoryId, discipline, kind, a, b] = parts;
  if (discipline !== "combat" && discipline !== "kata") return null;
  const d = discipline;
  let path = null;
  if (kind === "std" && a && b) {
    const round = parseInt(a.slice(1), 10);
    const idx = parseInt(b.slice(1), 10);
    if (Number.isFinite(round) && Number.isFinite(idx)) path = { kind: "std", round, idx };
  } else if (kind === "playin") {
    path = { kind: "playin" };
  } else if (kind === "series" && a) {
    const idx = parseInt(a.slice(1), 10);
    if (Number.isFinite(idx)) path = { kind: "series", idx };
  } else if (kind === "rr" && a) {
    if (a === "ab" || a === "ac" || a === "bc") path = { kind: "rr", pair: a };
  } else if (kind === "3rd") {
    path = { kind: "3rd" };
  }
  if (!path) return null;
  return { categoryId, subcategoryId, discipline: d, path };
}
function* iterateSubcategoryMatches(catId, sub) {
  const disciplines = Object.keys(sub.trees);
  for (const d of disciplines) {
    const tree = sub.trees[d];
    if (!tree) continue;
    const treeTag = d === "kata" ? "KATA" : "COMBAT";
    if (sub.type === "standard") {
      const t = tree;
      for (let r = 0; r < t.rounds.length; r++) {
        const round = t.rounds[r];
        for (let i = 0; i < round.length; i++) {
          yield {
            ref: { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "std", round: r, idx: i } },
            match: round[i],
            tree: treeTag
          };
        }
      }
      if (t.thirdPlace) {
        yield {
          ref: { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "3rd" } },
          match: t.thirdPlace,
          tree: treeTag
        };
      }
    } else if (sub.type === "playin") {
      const t = tree;
      yield {
        ref: { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "playin" } },
        match: t.extra,
        tree: treeTag
      };
      for (let r = 0; r < t.bracket.rounds.length; r++) {
        const round = t.bracket.rounds[r];
        for (let i = 0; i < round.length; i++) {
          yield {
            ref: { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "std", round: r, idx: i } },
            match: round[i],
            tree: treeTag
          };
        }
      }
    } else if (sub.type === "series") {
      const t = tree;
      for (let i = 0; i < t.matches.length; i++) {
        yield {
          ref: { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "series", idx: i } },
          match: t.matches[i],
          tree: treeTag
        };
      }
    } else if (sub.type === "roundrobin") {
      const t = tree;
      for (const m of t.matches) {
        if (!m.pair) continue;
        yield {
          ref: { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "rr", pair: m.pair } },
          match: m,
          tree: treeTag
        };
      }
    }
  }
}
function* iterateAllMatches(state) {
  for (const catId of state.tournament.categoryOrder) {
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      for (const it of iterateSubcategoryMatches(catId, sub)) {
        yield { ref: it.ref, match: it.match, sub, category: cat, tree: it.tree };
      }
    }
  }
}
function buildInitialEngineState() {
  return {
    config: { ...DEFAULT_ENGINE_CONFIG },
    areas: [],
    matches: {},
    competitors: {},
    subcategories: {},
    nextMatchPerArea: {},
    assignmentQueue: [],
    lastTickTs: 0
  };
}
function ensureEngineState(state) {
  if (!state.engine) state.engine = buildInitialEngineState();
  const eng = state.engine;
  const areaCount = state.tournament.settings.areaCount;
  if (eng.areas.length !== areaCount) {
    const next = [];
    for (let i = 0; i < areaCount; i++) {
      const prev = eng.areas[i];
      next.push(
        prev ?? {
          index: i,
          name: areaLabel(i),
          status: "LIBRE",
          assignedSubcategories: [],
          matchHistory: [],
          firstMatchAssignedTs: null,
          performanceRatio: null
        }
      );
    }
    eng.areas = next;
    const filtered = {};
    for (let i = 0; i < areaCount; i++) filtered[i] = eng.nextMatchPerArea[i] ?? null;
    eng.nextMatchPerArea = filtered;
  }
  return eng;
}
function readinessFromBracket(m) {
  const knownA = !!m.p1;
  const knownB = !!m.p2;
  const completed = !!m.winner;
  const isBye = m.p2 === "BYE" || m.p1 === "BYE";
  return { knownA, knownB, isBye, completed };
}
function hydrateEngineFromBracket(state, now) {
  const eng = ensureEngineState(state);
  const subSeen = /* @__PURE__ */ new Set();
  for (const catId of state.tournament.categoryOrder) {
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      subSeen.add(sub.id);
      if (!eng.subcategories[sub.id]) {
        eng.subcategories[sub.id] = {
          id: sub.id,
          checkInStatus: "OPEN",
          checkInClosedTs: null,
          officialStartTs: null,
          actualStartTs: null,
          completedTs: null,
          waitingSince: null,
          assignedAreaIndices: [],
          absentCompetitors: []
        };
      }
    }
  }
  for (const id of Object.keys(eng.subcategories)) {
    if (!subSeen.has(id)) delete eng.subcategories[id];
  }
  const compSeen = /* @__PURE__ */ new Set();
  for (const catId of state.tournament.categoryOrder) {
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      for (const name of sub.competitors) {
        if (!name) continue;
        compSeen.add(name);
        if (!eng.competitors[name]) {
          eng.competitors[name] = {
            id: name,
            status: "AVAILABLE",
            lastMatchEndTs: null,
            lastAreaIndex: null,
            currentAreaIndex: null
          };
        }
      }
    }
  }
  for (const id of Object.keys(eng.competitors)) {
    if (!compSeen.has(id)) delete eng.competitors[id];
  }
  const matchSeen = /* @__PURE__ */ new Set();
  for (const it of iterateAllMatches(state)) {
    const id = matchIdFromRef(it.ref);
    matchSeen.add(id);
    const existing = eng.matches[id];
    const r = readinessFromBracket(it.match);
    const tree = it.tree;
    let status;
    if (r.completed) status = "COMPLETED";
    else if (existing?.status === "IN_PROGRESS") status = "IN_PROGRESS";
    else if (r.knownA && r.knownB && !r.isBye) status = "READY";
    else status = "PENDING";
    eng.matches[id] = {
      id,
      ref: it.ref,
      discipline: it.ref.discipline,
      bracketTree: tree,
      status,
      assignedAreaIndex: existing?.assignedAreaIndex ?? null,
      startTs: existing?.startTs ?? null,
      endTs: existing?.endTs ?? null,
      isBye: r.isBye
    };
  }
  for (const id of Object.keys(eng.matches)) {
    if (!matchSeen.has(id)) delete eng.matches[id];
  }
  for (const c of Object.values(eng.competitors)) {
    refreshCompetitorStatus(c, eng, now);
  }
  for (const a of eng.areas) {
    a.status = computeAreaStatus(a, eng.config, now);
  }
  return eng;
}
function refreshCompetitorStatus(c, eng, now) {
  if (c.status === "ABSENT") return "ABSENT";
  if (c.status === "IN_MATCH") return "IN_MATCH";
  if (c.lastMatchEndTs && now - c.lastMatchEndTs < eng.config.minRestSeconds * 1e3) {
    c.status = "RESTING";
    return "RESTING";
  }
  c.status = "AVAILABLE";
  return "AVAILABLE";
}
function computeAreaStatus(area, config, now) {
  if (!area.firstMatchAssignedTs) {
    area.performanceRatio = null;
    return area.assignedSubcategories.length === 0 ? "LIBRE" : "ACTIVA";
  }
  const elapsed = Math.max(1, (now - area.firstMatchAssignedTs) / 1e3);
  const expected = elapsed / Math.max(1, config.avgMatchDurationSeconds);
  const completed = area.matchHistory.length;
  const ratio = completed / Math.max(1e-4, expected);
  area.performanceRatio = ratio;
  if (area.assignedSubcategories.length === 0 && completed === 0) return "LIBRE";
  return ratio >= config.delayThreshold ? "ACTIVA" : "RETRASADA";
}
function getMatchParticipants(state, ref) {
  const sub = getSubcategory(state, ref.categoryId, ref.subcategoryId);
  if (!sub) return { a: null, b: null };
  const tree = sub.trees[ref.discipline];
  if (!tree) return { a: null, b: null };
  if (sub.type === "standard") {
    const t = tree;
    if (ref.path.kind === "std") return { a: t.rounds[ref.path.round]?.[ref.path.idx]?.p1 ?? null, b: t.rounds[ref.path.round]?.[ref.path.idx]?.p2 ?? null };
    if (ref.path.kind === "3rd" && t.thirdPlace) return { a: t.thirdPlace.p1, b: t.thirdPlace.p2 };
  } else if (sub.type === "playin") {
    const t = tree;
    if (ref.path.kind === "playin") return { a: t.extra.p1, b: t.extra.p2 };
    if (ref.path.kind === "std") return { a: t.bracket.rounds[ref.path.round]?.[ref.path.idx]?.p1 ?? null, b: t.bracket.rounds[ref.path.round]?.[ref.path.idx]?.p2 ?? null };
  } else if (sub.type === "series") {
    const t = tree;
    if (ref.path.kind === "series") return { a: t.matches[ref.path.idx]?.p1 ?? null, b: t.matches[ref.path.idx]?.p2 ?? null };
  } else if (sub.type === "roundrobin") {
    const t = tree;
    if (ref.path.kind === "rr") {
      const pair = ref.path.pair;
      const target = t.matches.find((mm) => mm.pair === pair);
      return { a: target?.p1 ?? null, b: target?.p2 ?? null };
    }
  }
  return { a: null, b: null };
}
function restOk(eng, a, b, now) {
  const minMs = eng.config.minRestSeconds * 1e3;
  for (const name of [a, b]) {
    if (!name || name === "BYE") continue;
    const c = eng.competitors[name];
    if (!c) continue;
    if (c.status === "IN_MATCH") return false;
    if (c.lastMatchEndTs && now - c.lastMatchEndTs < minMs) return false;
  }
  return true;
}
function kataOrderingOk(state, eng, subcategoryId, discipline, a, b) {
  if (discipline !== "combat") return true;
  for (const name of [a, b]) {
    if (!name) continue;
    let pending = 0;
    for (const m of Object.values(eng.matches)) {
      if (m.ref.subcategoryId !== subcategoryId) continue;
      if (m.bracketTree !== "KATA") continue;
      if (m.status === "COMPLETED") continue;
      const parts = getMatchParticipants(state, m.ref);
      if (parts.a === name || parts.b === name) pending++;
    }
    if (pending > 0) return false;
  }
  return true;
}
function listReadyMatches(state, now) {
  const eng = ensureEngineState(state);
  const out = [];
  for (const m of Object.values(eng.matches)) {
    if (m.status !== "READY") continue;
    const parts = getMatchParticipants(state, m.ref);
    if (!parts.a || !parts.b) continue;
    if (parts.a === "BYE" || parts.b === "BYE") continue;
    if (!restOk(eng, parts.a, parts.b, now)) continue;
    if (!kataOrderingOk(state, eng, m.ref.subcategoryId, m.ref.discipline, parts.a, parts.b)) continue;
    out.push({ runtime: m, ref: m.ref, a: parts.a, b: parts.b });
  }
  return out;
}
function scorePair(ctx, area, m) {
  const cfg = ctx.eng.config;
  let score = 0;
  if (area.assignedSubcategories.includes(m.ref.subcategoryId)) {
    score += cfg.scoreContinuityBonus;
  }
  if (area.status === "LIBRE") score += cfg.scoreFreeAreaBonus;
  if (area.status === "RETRASADA") score += cfg.scoreDelayPenalty;
  const compA = ctx.eng.competitors[m.a];
  const compB = ctx.eng.competitors[m.b];
  for (const c of [compA, compB]) {
    if (!c || c.lastAreaIndex === null) continue;
    if (Math.abs(c.lastAreaIndex - area.index) === 1) {
      score += cfg.scoreAdjacencyBonus;
      break;
    }
  }
  const subRuntime = ctx.eng.subcategories[m.ref.subcategoryId];
  if (subRuntime?.waitingSince) {
    const ageMs = ctx.now - subRuntime.waitingSince;
    if (ageMs > 6e4) score += cfg.scoreAgingBonus;
  }
  if (m.ref.path.kind === "std" && m.ref.path.round > 0) {
    score += cfg.scoreCriticalPathBonus;
  }
  return score;
}
function runEngineTick(state, opts = {}) {
  const now = opts.now ?? Date.now();
  const eng = hydrateEngineFromBracket(state, now);
  eng.lastTickTs = now;
  for (const a of eng.areas) {
    a.assignedSubcategories = a.assignedSubcategories.filter((subId) => {
      const sub = eng.subcategories[subId];
      if (!sub) return false;
      if (sub.completedTs) return false;
      return true;
    });
  }
  const ready = listReadyMatches(state, now);
  const ctx = { state, eng, now };
  const usedMatchIds = /* @__PURE__ */ new Set();
  for (let i = 0; i < eng.areas.length; i++) eng.nextMatchPerArea[i] = null;
  const areasByPriority = [...eng.areas].sort((x, y) => {
    const order = (s) => s === "LIBRE" ? 0 : s === "ACTIVA" ? 1 : 2;
    return order(x.status) - order(y.status);
  });
  for (const area of areasByPriority) {
    let best = null;
    for (const m of ready) {
      if (usedMatchIds.has(m.runtime.id)) continue;
      const sc = scorePair(ctx, area, m);
      if (!best || sc > best.score) best = { match: m, score: sc };
    }
    if (best) {
      usedMatchIds.add(best.match.runtime.id);
      const isInterleaved = !area.assignedSubcategories.includes(best.match.ref.subcategoryId) && area.assignedSubcategories.length > 0;
      const primary = isInterleaved ? area.assignedSubcategories[0] : null;
      eng.nextMatchPerArea[area.index] = {
        matchId: best.match.runtime.id,
        isInterleaved,
        primarySubcategoryId: primary
      };
    }
  }
  return eng;
}
function closeCheckIn(state, subcategoryId, now) {
  const eng = ensureEngineState(state);
  const sub = eng.subcategories[subcategoryId];
  if (!sub) return;
  if (sub.checkInStatus === "CLOSED") return;
  sub.checkInStatus = "CLOSED";
  sub.checkInClosedTs = now;
  sub.waitingSince = now;
  if (!eng.assignmentQueue.includes(subcategoryId)) {
    eng.assignmentQueue.push(subcategoryId);
  }
}
function recordMatchStart(state, matchId, areaIndex, now) {
  const eng = ensureEngineState(state);
  const m = eng.matches[matchId];
  if (!m) return;
  m.status = "IN_PROGRESS";
  m.startTs = now;
  m.assignedAreaIndex = areaIndex;
  const area = eng.areas[areaIndex];
  if (area) {
    if (!area.firstMatchAssignedTs) area.firstMatchAssignedTs = now;
    if (!area.assignedSubcategories.includes(m.ref.subcategoryId)) {
      area.assignedSubcategories.push(m.ref.subcategoryId);
    }
  }
  const parts = getMatchParticipants(state, m.ref);
  for (const name of [parts.a, parts.b]) {
    if (!name || name === "BYE") continue;
    const c = eng.competitors[name];
    if (!c) continue;
    c.status = "IN_MATCH";
    c.currentAreaIndex = areaIndex;
  }
  const subRuntime = eng.subcategories[m.ref.subcategoryId];
  if (subRuntime && !subRuntime.actualStartTs) subRuntime.actualStartTs = now;
}
function recordMatchEnd(state, matchId, now) {
  const eng = ensureEngineState(state);
  const m = eng.matches[matchId];
  if (!m) return;
  m.status = "COMPLETED";
  m.endTs = now;
  const areaIdx = m.assignedAreaIndex;
  if (areaIdx !== null) {
    const area = eng.areas[areaIdx];
    if (area && m.startTs) {
      area.matchHistory.push({ matchId, startTs: m.startTs, endTs: now });
    }
  }
  const parts = getMatchParticipants(state, m.ref);
  for (const name of [parts.a, parts.b]) {
    if (!name || name === "BYE") continue;
    const c = eng.competitors[name];
    if (!c) continue;
    c.lastMatchEndTs = now;
    c.lastAreaIndex = areaIdx;
    c.currentAreaIndex = null;
    c.status = "RESTING";
  }
}
function markCompetitorAbsent(state, competitorName) {
  const eng = ensureEngineState(state);
  const c = eng.competitors[competitorName];
  if (!c) return;
  c.status = "ABSENT";
}
function updateEngineConfig(state, patch) {
  const eng = ensureEngineState(state);
  eng.config = { ...eng.config, ...patch };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AGE_RANGES,
  AGE_RANGE_LABEL,
  BELT_ALIASES,
  BELT_LABEL_EN,
  BELT_ORDER,
  CHANNEL_NAME,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_KEYS,
  KATA_DISABLED_COMMANDS,
  KEY_LABELS,
  STORAGE_KEY,
  TIMER_OWNER_KEY,
  addCategoryDef,
  addParticipant,
  ageRangeFor,
  allMatchesComplete,
  areaLabel,
  assignSubcategoryToArea,
  buildAreaPlan,
  buildInitialEngineState,
  buildInitialState,
  buildPlayinTree,
  buildRRTree,
  buildSeriesTree,
  buildStandardTree,
  buildSubcategory,
  buildSubcategorySpecs,
  buildTreeFromSpec,
  captureSb,
  categoryDefMatches,
  categoryHasArea,
  categoryIdFor,
  categoryNameFor,
  closeCheckIn,
  computeAreaStatus,
  computeCombatWinner,
  computeKataWinner,
  computeWinner,
  consolidatePlayinOrphans,
  defaultCategoryDefs,
  describeCategoryDef,
  describeRefLabel,
  distributeRemainder,
  emptyMatch,
  ensureEngineState,
  finalizeMatchByRef,
  finalizeRR,
  finalizeSeries,
  findCategoryForParticipant,
  findNextMatch,
  fullName,
  generateMockTournament,
  generateRandomSeed,
  getCategory,
  getMatchByRef,
  getSubcategory,
  hydrateEngineFromBracket,
  listReadyMatches,
  loadMatchToScoreboardImpl,
  loadState,
  markCompetitorAbsent,
  matchIdFromRef,
  mulberry32,
  newCategoryDefId,
  newParticipantId,
  parseParticipantsCsv,
  propagateBracketWinner,
  rebuildAllSubcategories,
  rebuildCategoriesFromParticipants,
  rebuildCategorySubcategories,
  recordMatchEnd,
  recordMatchStart,
  refFromMatchId,
  removeCategoryDef,
  removeParticipant,
  replaceParticipants,
  reseed,
  resetLiveScoreboard,
  roundLabel,
  runEngineTick,
  samePath,
  setAreaCount,
  setCategoryDefs,
  setDisciplineMode,
  setLogoUrl,
  setSubcategorySize,
  shuffleSeeded,
  sortDefaultDefs,
  stringifyParticipantsCsv,
  subcategoryIdsForArea,
  subcategoryStatus,
  treeComplete,
  treeHasProgress,
  updateCategoryDef,
  updateEngineConfig
});
