/**
 * Builds outfit suggestions from the pieces a person actually owns.
 *
 * The generator does three real things, not a random shuffle:
 * 1. Assembles valid slot combinations (a dress stands alone; a top+bottom
 *    pair does not combine with a dress in the same outfit).
 * 2. Scores every combination on three real style rules: color harmony
 *    (src/lib/colorTheory.ts), formality cohesion (don't pair a formal
 *    blazer with gym shoes), and pattern clash (at most one bold pattern per
 *    outfit, a classic styling rule).
 * 3. Explains the score in plain language so the suggestion is legible, not
 *    a black box.
 */
import { hexToHsl, harmonyLabel, pairHarmony } from './colorTheory';
import type { ClothingItem, Formality, OutfitSuggestion, Pattern } from './types';

const FORMALITY_RANK: Record<Formality, number> = {
  casual: 0,
  'smart-casual': 1,
  formal: 2,
};

const BOLD_PATTERNS: Pattern[] = ['striped', 'plaid', 'floral', 'graphic'];

function colorScore(items: ClothingItem[]): { score: number; label: string } {
  if (items.length < 2) return { score: 1, label: 'single piece' };

  const hsls = items.map((item) => hexToHsl(item.colorHex));
  let total = 0;
  let count = 0;
  const kinds = new Map<string, number>();

  for (let i = 0; i < hsls.length; i += 1) {
    for (let j = i + 1; j < hsls.length; j += 1) {
      const harmony = pairHarmony(hsls[i], hsls[j]);
      total += harmony.score;
      count += 1;
      kinds.set(harmony.kind, (kinds.get(harmony.kind) ?? 0) + 1);
    }
  }

  const bestKind = [...kinds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    score: count > 0 ? total / count : 1,
    label: bestKind ? harmonyLabel(bestKind as Parameters<typeof harmonyLabel>[0]) : 'neutral base',
  };
}

function formalityScore(items: ClothingItem[]): number {
  const ranks = items.map((item) => FORMALITY_RANK[item.formality]);
  const spread = Math.max(...ranks) - Math.min(...ranks);
  return Math.max(0.3, 1 - spread * 0.3);
}

function patternScore(items: ClothingItem[]): number {
  const boldCount = items.filter((item) => BOLD_PATTERNS.includes(item.pattern)).length;
  if (boldCount <= 1) return 1;
  if (boldCount === 2) return 0.5;
  return 0.2;
}

function buildReasons(items: ClothingItem[], colorLabel: string, formality: number, pattern: number): string[] {
  const reasons: string[] = [];
  const names = items.map((item) => item.colorName.toLowerCase());
  const uniqueNames = [...new Set(names)];

  if (colorLabel === 'neutral base') {
    reasons.push('Neutral pieces that pair safely with anything in your closet.');
  } else if (colorLabel === 'complementary contrast') {
    reasons.push(`${capitalize(uniqueNames[0] ?? '')} and ${uniqueNames[1] ?? 'the rest'} sit opposite on the color wheel for a crisp, intentional contrast.`);
  } else if (colorLabel === 'analogous colors') {
    reasons.push(`${uniqueNames.map(capitalize).join(', ')} sit next to each other on the color wheel for an easy, cohesive palette.`);
  } else if (colorLabel === 'triadic contrast') {
    reasons.push('Colors spaced evenly around the wheel for balanced contrast without clashing.');
  } else if (colorLabel === 'tonal match') {
    reasons.push('Close tones through the outfit for a calm, monochrome look.');
  } else {
    reasons.push('Colors are close enough to feel off together — consider swapping one piece.');
  }

  if (formality >= 0.9) {
    reasons.push('Formality matches across every piece.');
  } else if (formality < 0.6) {
    reasons.push('Mixes casual and dressy pieces — fine for a relaxed look, less so for formal settings.');
  }

  if (pattern < 1) {
    reasons.push(pattern <= 0.3 ? 'Several bold patterns together will compete for attention.' : 'Two bold patterns together — bolder than a classic pairing.');
  }

  return reasons;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

/** Scores an arbitrary set of items a person picked by hand — same rules the generator uses. */
export function scoreOutfit(items: ClothingItem[]): OutfitSuggestion {
  const color = colorScore(items);
  const formality = formalityScore(items);
  const pattern = patternScore(items);
  const score = color.score * 0.5 + formality * 0.3 + pattern * 0.2;

  return {
    items,
    score,
    reasons: buildReasons(items, color.label, formality, pattern),
  };
}

export interface GenerateOptions {
  /** Maximum number of ranked suggestions to return. */
  limit?: number;
}

/**
 * Generates ranked outfit suggestions from the given wardrobe. Returns an
 * empty array when there isn't enough to build a full outfit (needs at least
 * one top+bottom pair or one dress).
 */
export function generateOutfits(wardrobe: ClothingItem[], options: GenerateOptions = {}): OutfitSuggestion[] {
  const limit = options.limit ?? 5;
  const byCategory = {
    top: wardrobe.filter((i) => i.category === 'top'),
    bottom: wardrobe.filter((i) => i.category === 'bottom'),
    dress: wardrobe.filter((i) => i.category === 'dress'),
    outerwear: wardrobe.filter((i) => i.category === 'outerwear'),
    shoes: wardrobe.filter((i) => i.category === 'shoes'),
    accessory: wardrobe.filter((i) => i.category === 'accessory'),
  };

  const bases: ClothingItem[][] = [];

  for (const top of byCategory.top) {
    for (const bottom of byCategory.bottom) {
      bases.push([top, bottom]);
    }
  }
  for (const dress of byCategory.dress) {
    bases.push([dress]);
  }

  if (bases.length === 0) return [];

  const combinations: ClothingItem[][] = [];
  const outerwearOptions: (ClothingItem | null)[] = [null, ...byCategory.outerwear];
  const shoeOptions: (ClothingItem | null)[] = byCategory.shoes.length > 0 ? byCategory.shoes : [null];
  const accessoryOptions: (ClothingItem | null)[] = [null, ...byCategory.accessory];

  for (const base of bases) {
    for (const outerwear of outerwearOptions) {
      for (const shoes of shoeOptions) {
        for (const accessory of accessoryOptions) {
          const combo = [base, outerwear, shoes, accessory]
            .flat()
            .filter((item): item is ClothingItem => item !== null);
          combinations.push(combo);
        }
      }
    }
  }

  return combinations
    .map(scoreOutfit)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Deterministic "today's outfit": picks the same top suggestion all day for
 * a given date, then rotates to a fresh one tomorrow, by seeding the choice
 * with the date instead of pure randomness.
 */
export function pickTodaysOutfit(wardrobe: ClothingItem[], date: Date = new Date()): OutfitSuggestion | null {
  const suggestions = generateOutfits(wardrobe, { limit: 8 });
  if (suggestions.length === 0) return null;

  const seed = Number(`${date.getFullYear()}${date.getMonth()}${date.getDate()}`);
  const index = seed % suggestions.length;
  return suggestions[index];
}
