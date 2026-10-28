/**
 * Builds outfit suggestions from the pieces a person actually owns.
 *
 * The generator does four real things, not a random shuffle:
 * 1. Assembles valid slot combinations (a dress stands alone; a top+bottom
 *    pair does not combine with a dress in the same outfit).
 * 2. Scores every combination on real style rules: color harmony
 *    (src/lib/colorTheory.ts), formality cohesion (don't pair a formal
 *    blazer with gym shoes), pattern clash (at most one bold pattern per
 *    outfit, a classic styling rule), and recency (pieces worn in the last
 *    week score lower, so a small wardrobe doesn't get recommended on
 *    repeat every day — see `freshnessScore`).
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

/** How many days until a recently-worn piece is scored as fully "fresh" again. */
const FRESHNESS_LOOKBACK_DAYS = 7;

/** Maps an item id to the ISO timestamp it was most recently logged as worn. */
export type LastWornMap = Map<string, string>;

/**
 * 1 = not worn within the lookback window (or never worn). Ramps down toward
 * 0 the more recently an item was worn, so the generator favors pieces that
 * have had a rest instead of repeating the same "best" combo every day.
 */
function itemFreshness(item: ClothingItem, lastWornAt: LastWornMap, now: Date): number {
  const wornAt = lastWornAt.get(item.id);
  if (!wornAt) return 1;

  const daysSince = (now.getTime() - new Date(wornAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince >= FRESHNESS_LOOKBACK_DAYS) return 1;
  return Math.max(0, daysSince / FRESHNESS_LOOKBACK_DAYS);
}

function freshnessScore(items: ClothingItem[], lastWornAt: LastWornMap, now: Date): number {
  if (lastWornAt.size === 0 || items.length === 0) return 1;
  const total = items.reduce((sum, item) => sum + itemFreshness(item, lastWornAt, now), 0);
  return total / items.length;
}

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

function buildReasons(
  items: ClothingItem[],
  colorLabel: string,
  formality: number,
  pattern: number,
  freshness: number,
): string[] {
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

  if (freshness < 0.5) {
    reasons.push('Repeats a piece you wore earlier this week — shuffle for a fresher pick.');
  }

  return reasons;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

/**
 * Scores an arbitrary set of items a person picked by hand — same rules the
 * generator uses. `lastWornAt` is optional: pass it (item id -> ISO worn
 * timestamp) to also weigh how recently each piece was worn; omit it for a
 * pure style score (e.g. the manual "build an outfit" screen, where the
 * person is deliberately choosing, not asking for a fresh suggestion).
 */
export function scoreOutfit(items: ClothingItem[], lastWornAt: LastWornMap = new Map(), now: Date = new Date()): OutfitSuggestion {
  const color = colorScore(items);
  const formality = formalityScore(items);
  const pattern = patternScore(items);
  const freshness = freshnessScore(items, lastWornAt, now);
  const score = color.score * 0.4 + formality * 0.25 + pattern * 0.15 + freshness * 0.2;

  return {
    items,
    score,
    reasons: buildReasons(items, color.label, formality, pattern, freshness),
  };
}

export interface GenerateOptions {
  /** Maximum number of ranked suggestions to return. */
  limit?: number;
  /** Item id -> ISO timestamp last logged as worn, used to favor fresher pieces. */
  lastWornAt?: LastWornMap;
  now?: Date;
}

/**
 * Generates ranked outfit suggestions from the given wardrobe. Returns an
 * empty array when there isn't enough to build a full outfit (needs at least
 * one top+bottom pair or one dress).
 */
export function generateOutfits(wardrobe: ClothingItem[], options: GenerateOptions = {}): OutfitSuggestion[] {
  const limit = options.limit ?? 5;
  const lastWornAt = options.lastWornAt ?? new Map();
  const now = options.now ?? new Date();
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
    .map((combo) => scoreOutfit(combo, lastWornAt, now))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Deterministic "today's outfit": picks the same top suggestion all day for
 * a given date, then rotates to a fresh one tomorrow, by seeding the choice
 * with the date instead of pure randomness. `lastWornAt` lets the ranking
 * itself favor pieces that haven't been worn in the last week, on top of the
 * date-seeded rotation.
 */
export function pickTodaysOutfit(
  wardrobe: ClothingItem[],
  date: Date = new Date(),
  lastWornAt: LastWornMap = new Map(),
): OutfitSuggestion | null {
  const suggestions = generateOutfits(wardrobe, { limit: 8, lastWornAt, now: date });
  if (suggestions.length === 0) return null;

  const seed = Number(`${date.getFullYear()}${date.getMonth()}${date.getDate()}`);
  const index = seed % suggestions.length;
  return suggestions[index];
}
