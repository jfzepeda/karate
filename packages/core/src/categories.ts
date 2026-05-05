import type {
  AgeRange,
  BeltColor,
  Category,
  Participant,
  TournamentSettings,
} from "./types";
import { AGE_RANGES, BELT_LABEL_EN, BELT_ORDER } from "./data";
import { rebuildCategorySubcategories } from "./subcategories";

export function ageRangeFor(age: number): AgeRange {
  if (age <= 6) return "4-6";
  if (age <= 9) return "7-9";
  if (age <= 12) return "10-12";
  if (age <= 15) return "13-15";
  if (age <= 17) return "16-17";
  return "adult";
}

export function categoryIdFor(belt: BeltColor, ar: AgeRange): string {
  return `${belt}-${ar}`;
}

export function categoryNameFor(belt: BeltColor, ar: AgeRange): string {
  const beltLabel = BELT_LABEL_EN[belt];
  if (ar === "adult") return `${beltLabel} Adult`;
  return `${beltLabel} ${ar}`;
}

export function fullName(p: Participant): string {
  return `${p.nombre} ${p.apellido}`.trim();
}

/**
 * Group participants into categories by (belt, ageRange) and rebuild the
 * subcategories of each category according to the tournament settings.
 *
 * Categories are sorted by belt rank, then by age range.
 */
export function rebuildCategoriesFromParticipants(
  participants: Participant[],
  settings: TournamentSettings,
  prevActiveId: string | null = null
): { categories: Record<string, Category>; categoryOrder: string[]; activeCategoryId: string | null } {
  const buckets = new Map<string, Participant[]>();
  for (const p of participants) {
    const ar = ageRangeFor(p.age);
    const id = categoryIdFor(p.beltColor, ar);
    const arr = buckets.get(id);
    if (arr) arr.push(p);
    else buckets.set(id, [p]);
  }

  const categories: Record<string, Category> = {};
  const order: { id: string; belt: BeltColor; ar: AgeRange }[] = [];

  for (const [id, list] of buckets) {
    const sample = list[0];
    const ar = ageRangeFor(sample.age);
    const belt = sample.beltColor;
    const cat: Category = {
      id,
      name: categoryNameFor(belt, ar),
      beltColor: belt,
      ageRange: ar,
      competitors: list.map(fullName),
      subcategories: [],
      activeSubcategoryId: null,
      champion: {},
    };
    rebuildCategorySubcategories(cat, settings);
    categories[id] = cat;
    order.push({ id, belt, ar });
  }

  order.sort((a, b) => {
    const beltDiff = BELT_ORDER.indexOf(a.belt) - BELT_ORDER.indexOf(b.belt);
    if (beltDiff !== 0) return beltDiff;
    return AGE_RANGES.indexOf(a.ar) - AGE_RANGES.indexOf(b.ar);
  });

  const categoryOrder = order.map((o) => o.id);
  const activeCategoryId =
    prevActiveId && categories[prevActiveId]
      ? prevActiveId
      : categoryOrder[0] ?? null;

  return { categories, categoryOrder, activeCategoryId };
}
