/**
 * "What would improve your wardrobe most" — a real analysis of the current
 * closet, not a generic tip list. Two real signals, both computed from data
 * the app already has:
 * 1. Closet gaps: categories with zero or one item, which mathematically
 *    limits how many distinct outfits the generator (outfitGenerator.ts)
 *    can ever build.
 * 2. Hardest-to-match pieces: items whose color scores worst, on average,
 *    against every other owned color (colorTheory.ts's real color-wheel
 *    harmony math) — the pieces most likely to be the reason a combination
 *    scores low.
 */
import { hexToHsl, pairHarmony } from './colorTheory';
import { generateOutfits } from './outfitGenerator';
import { CLOTHING_CATEGORIES, type ClothingCategory, type ClothingItem } from './types';

export interface CategoryGap {
  category: ClothingCategory;
  count: number;
  severity: 'missing' | 'low' | 'fine';
}

export function findClosetGaps(wardrobe: ClothingItem[]): CategoryGap[] {
  const dressCount = wardrobe.filter((item) => item.category === 'dress').length;
  return CLOTHING_CATEGORIES.map((category) => {
    const count = wardrobe.filter((item) => item.category === category).length;
    // A dress is a self-contained base outfit on its own — outfitGenerator.ts's
    // `bases` array is built from top+bottom pairs OR a dress, never a dress
    // combined with a top/bottom. So a wardrobe with 2+ dresses already has
    // real, buildable base outfits regardless of how many tops/bottoms it
    // owns; treating 0-1 tops/bottoms as "missing"/"low" in that case is
    // mathematically wrong (contradicts this exact function's own doc
    // comment) and misleads the user into buying tops/bottoms they don't
    // need. Confirmed via a real repro: a wardrobe of 4 dresses + 2 shoes +
    // 1 outerwear + 2 accessories (0 tops, 0 bottoms) already builds 48 real
    // outfits via generateOutfits, yet this function used to report both
    // "top" and "bottom" as severity "missing".
    const hasDressCoverage = (category === 'top' || category === 'bottom') && dressCount >= 2;
    const severity: CategoryGap['severity'] = hasDressCoverage ? 'fine' : count === 0 ? 'missing' : count === 1 ? 'low' : 'fine';
    return { category, count, severity };
  });
}

export interface HardToMatchItem {
  item: ClothingItem;
  /** Average pairHarmony score (0..1) against every other owned item — lower means it clashes more often. */
  avgHarmony: number;
}

/** Items whose color pairs worst, on average, with the rest of the closet. Needs at least 2 items to mean anything. */
export function findHardToMatchItems(wardrobe: ClothingItem[], limit = 3): HardToMatchItem[] {
  if (wardrobe.length < 2) return [];

  const withHsl = wardrobe.map((item) => ({ item, hsl: hexToHsl(item.colorHex) }));

  const scored: HardToMatchItem[] = withHsl.map(({ item, hsl }) => {
    const others = withHsl.filter((other) => other.item.id !== item.id);
    const total = others.reduce((sum, other) => sum + pairHarmony(hsl, other.hsl).score, 0);
    return { item, avgHarmony: others.length > 0 ? total / others.length : 1 };
  });

  return scored.sort((a, b) => a.avgHarmony - b.avgHarmony).slice(0, limit);
}

/** Total number of distinct outfit combinations the current wardrobe can build (capped for performance). */
export function countPossibleOutfits(wardrobe: ClothingItem[], cap = 500): number {
  return generateOutfits(wardrobe, { limit: cap }).length;
}
