// Everyday kitchen measures, so a recipe can say "2 cups of flour" while the shelf
// price is "GHS 22 for 1 kg". All spoon and cup maths hangs off the cup.

export const TBSP_PER_CUP = 16;
export const TSP_PER_CUP = 48;
const ML_PER_CUP = 240;

// Grams in one cup, by ingredient keyword. Rough kitchen averages, good enough for costing.
const gramsPerCup: [RegExp, number][] = [
  [/corn ?flour|corn ?starch|starch/i, 130],
  [/icing sugar|powdered sugar/i, 120],
  [/brown sugar/i, 215],
  [/sugar/i, 200],
  [/cake flour|self[- ]raising|plain flour|flour/i, 125],
  [/cocoa/i, 85],
  [/butter|margarine|blue band/i, 227],
  [/honey|syrup|condensed/i, 340],
  [/oat/i, 90],
  [/rice/i, 185],
  [/desiccated|coconut/i, 90],
  [/chocolate chips|chocolate/i, 170],
  [/baking powder|baking soda|bicarb/i, 230],
  [/salt/i, 290],
  [/milk powder/i, 120],
];

const liquid = /milk|water|oil|cream|juice|essence|extract|vinegar|yoghurt|yogurt|vanilla/i;

const gramsInUnit: Record<string, number> = { kg: 1000, g: 1, gram: 1, grams: 1, lb: 454, oz: 28 };
const mlInUnit: Record<string, number> = { l: 1000, litre: 1000, liter: 1000, ml: 1, gallon: 3785 };

// Shelf units in the price list are often pack sizes: "500g", "2kg", "1 litre", "28ml".
function parseUnit(unit: string): { amount: number; base: string } {
  const match = unit.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  return match ? { amount: Number(match[1]), base: match[2]! } : { amount: 1, base: unit.trim().toLowerCase() };
}

/** Best guess of how many cups are in one purchase unit, or null when it can't tell. */
export function suggestCupsPerUnit(name: string, unit: string): number | null {
  const { amount, base } = parseUnit(unit);
  if (mlInUnit[base] && liquid.test(name)) return round((amount * mlInUnit[base]!) / ML_PER_CUP);
  if (gramsInUnit[base]) {
    const grams = amount * gramsInUnit[base]!;
    const match = gramsPerCup.find(([pattern]) => pattern.test(name));
    if (match) return round(grams / match[1]);
    if (liquid.test(name)) return round(grams / ML_PER_CUP);
  }
  return null;
}

const round = (value: number) => Math.round(value * 100) / 100;

export type LineUnit = 'purchase' | 'measure' | 'tbsp' | 'tsp';

export type MeasurableIngredient = { cost: number; unit: string; measureUnit?: string | null; unitsPerMeasure?: number | null };

/** The ways a quantity of this ingredient can be entered, with the price of one of each. */
export function unitOptions(item: MeasurableIngredient): { value: LineUnit; label: string; cost: number }[] {
  const options: { value: LineUnit; label: string; cost: number }[] = [{ value: 'purchase', label: item.unit, cost: item.cost }];
  if (item.measureUnit && item.unitsPerMeasure) {
    const perMeasure = item.cost / item.unitsPerMeasure;
    options.push({ value: 'measure', label: item.measureUnit, cost: perMeasure });
    if (item.measureUnit.toLowerCase().startsWith('cup')) {
      options.push({ value: 'tbsp', label: 'tbsp', cost: perMeasure / TBSP_PER_CUP });
      options.push({ value: 'tsp', label: 'tsp', cost: perMeasure / TSP_PER_CUP });
    }
  }
  return options;
}
