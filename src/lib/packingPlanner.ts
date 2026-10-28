/**
 * Builds a multi-day packing plan from a wardrobe subset, reusing the real
 * outfit generator rather than inventing separate logic. Each day's choice
 * is recorded into a synthetic "last worn" map before picking the next day,
 * so the generator's existing freshness scoring (src/lib/outfitGenerator.ts)
 * naturally spreads different pieces across the trip instead of repeating
 * the single best-scoring combo every day.
 */
import { generateOutfits } from './outfitGenerator';
import type { ClothingItem, Formality, OutfitSuggestion } from './types';

export type PackingOccasion = Formality | 'any';

export interface PackingDay {
  day: number;
  date: string; // ISO date, for display only
  suggestion: OutfitSuggestion;
}

export interface PackedItem {
  item: ClothingItem;
  daysWorn: number;
}

/**
 * Restricts the "core" slots (top/bottom/dress — the pieces that actually
 * set the occasion) to the chosen formality; outerwear/shoes/accessory stay
 * open since a trip usually reuses the same coat/shoes regardless of how
 * dressy a given day's core outfit is.
 */
export function filterWardrobeByOccasion(wardrobe: ClothingItem[], occasion: PackingOccasion): ClothingItem[] {
  if (occasion === 'any') return wardrobe;
  return wardrobe.filter((item) => {
    if (item.category === 'top' || item.category === 'bottom' || item.category === 'dress') {
      return item.formality === occasion;
    }
    return true;
  });
}

/**
 * Picks one outfit per day for `days` days. Stops early (returns fewer days
 * than requested) if the wardrobe can't produce any valid combination at
 * all — callers should treat a shorter-than-requested result as "not enough
 * pieces" rather than a bug.
 */
export function buildPackingPlan(wardrobe: ClothingItem[], days: number, startDate: Date = new Date()): PackingDay[] {
  const lastWornAt = new Map<string, string>();
  const plan: PackingDay[] = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const now = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    const [top] = generateOutfits(wardrobe, { limit: 1, lastWornAt, now });
    if (!top) break;

    plan.push({ day: dayIndex + 1, date: now.toISOString(), suggestion: top });
    const wornIso = now.toISOString();
    for (const item of top.items) {
      lastWornAt.set(item.id, wornIso);
    }
  }

  return plan;
}

/** Flattens a packing plan into the unique pieces to actually pack, with how many days each is used. */
export function summarizePackingList(plan: PackingDay[]): PackedItem[] {
  const byId = new Map<string, PackedItem>();
  for (const day of plan) {
    for (const item of day.suggestion.items) {
      const existing = byId.get(item.id);
      if (existing) {
        existing.daysWorn += 1;
      } else {
        byId.set(item.id, { item, daysWorn: 1 });
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.daysWorn - a.daysWorn || a.item.name.localeCompare(b.item.name));
}
