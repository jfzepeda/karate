import type { CommandKey } from "./types";

export const FIRST_NAMES = [
  "Carlos","Ana","Diego","Sofía","Miguel","Valentina","Andrés","Isabella",
  "Sebastián","Camila","Mateo","Lucía","Fernando","Daniela","Alejandro",
  "Natalia","Pablo","María","Javier","Laura","Daniel","Marta","Manuel",
  "Patricia","Luis","Cristina","Antonio","Beatriz","Pedro","Pilar",
  "Ricardo","Sara","Roberto","Andrea","Eduardo","Paula","Rafael","Rocío",
  "Jorge","Inés","Juan","Clara","Iván","Julia","Hugo","Adriana","Bruno",
  "Mónica","Marcos","Alicia","Nicolás","Raquel","Adrián","Silvia","Ángel",
  "Victoria","Esteban","Elena","Joaquín","Carmen","Gonzalo","Teresa",
  "Tomás","Esther","Raúl","Noelia","Óscar","Verónica","Vicente","Lorena",
];

export const LAST_NAMES = [
  "López","Martínez","Ruiz","Torres","Cruz","Mora","Reyes","Gil","Vega",
  "Rojas","Herrera","Ríos","Lara","Paz","Fuentes","García","González",
  "Rodríguez","Fernández","Sánchez","Pérez","Jiménez","Romero","Álvarez",
  "Muñoz","Gutiérrez","Navarro","Domínguez","Vázquez","Ramos","Molina",
  "Delgado","Castro","Ortega","Rubio","Marín","Iglesias","Blanco","Suárez",
  "Medina","Cortés","Peña","Aguilar","Vargas","Pacheco","Salazar","Cabrera",
  "Mendoza","Carrasco","Soto","Ibáñez","Vila","Serrano","Hidalgo","León",
  "Calvo","Rivas","Ortiz","Esteban","Gallego","Moreno","Crespo","Bravo",
];

export function generateRoster(seed: number, count: number): string[] {
  const set = new Set<string>();
  let i = seed;
  let guard = 0;
  while (set.size < count && guard++ < 5000) {
    const f = FIRST_NAMES[i % FIRST_NAMES.length];
    const l = LAST_NAMES[(Math.floor(i / 3) * 13 + i * 7) % LAST_NAMES.length];
    set.add(`${f} ${l}`);
    i++;
  }
  return Array.from(set);
}

export interface CategorySeed {
  id: string;
  name: string;
  count: number;
  seed: number;
}

export const CATEGORY_SEEDS: CategorySeed[] = [
  { id: "yellow-4-6",  name: "Yellow 4-6",  count: 41, seed: 101 },
  { id: "brown-10-12", name: "Brown 10-12", count: 47, seed: 317 },
  { id: "black-13-15", name: "Black 13-15", count: 43, seed: 521 },
  { id: "adult-open",  name: "Adult Open",  count: 49, seed: 739 },
];

export const DEFAULT_KEYS: Record<CommandKey, string> = {
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
  subSecond: "-",
};

export const KEY_LABELS: Record<CommandKey, string> = {
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
  subSecond: "Subtract 1 second",
};

export const KATA_DISABLED_COMMANDS = new Set<CommandKey>([
  "senshu", "penalty", "pauseTimer", "addSecond", "subSecond",
]);
