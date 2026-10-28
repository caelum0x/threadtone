/**
 * CRUD for saved/worn outfits. An outfit stores the item ids that made it up
 * at the time it was built — if an item is later deleted, the outfit keeps
 * the reference and the UI filters out the missing item rather than
 * crashing (see outfit/[id].tsx).
 */
import { db } from '../db/client';
import { newId } from '../db/ids';
import type { NewOutfit, Outfit } from '../lib/types';
import { mapOutfitRow, type OutfitRow } from './rows';

export async function listOutfits(): Promise<Outfit[]> {
  const rows = await db.getAllAsync<OutfitRow>('SELECT * FROM outfits ORDER BY created_at DESC;');
  return rows.map(mapOutfitRow);
}

/**
 * Item id -> the most recent ISO timestamp that item was logged as worn,
 * across every saved outfit. Feeds the outfit generator's freshness scoring
 * (src/lib/outfitGenerator.ts) so it can favor pieces that haven't been worn
 * in a while instead of repeating the same "best" combo every day.
 */
export async function getLastWornMap(): Promise<Map<string, string>> {
  const outfits = await listOutfits();
  const lastWornAt = new Map<string, string>();

  for (const outfit of outfits) {
    if (!outfit.wornAt) continue;
    for (const itemId of outfit.itemIds) {
      const current = lastWornAt.get(itemId);
      if (!current || outfit.wornAt > current) {
        lastWornAt.set(itemId, outfit.wornAt);
      }
    }
  }

  return lastWornAt;
}

export async function getOutfit(id: string): Promise<Outfit | null> {
  const row = await db.getFirstAsync<OutfitRow>('SELECT * FROM outfits WHERE id = ?;', [id]);
  return row ? mapOutfitRow(row) : null;
}

export async function createOutfit(input: NewOutfit): Promise<Outfit> {
  if (input.itemIds.length === 0) {
    throw new Error('An outfit needs at least one item.');
  }

  const id = newId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO outfits (id, item_ids, note, favorite, worn_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, JSON.stringify(input.itemIds), input.note, input.favorite ? 1 : 0, input.wornAt, createdAt],
  );

  return { ...input, id, createdAt };
}

export async function markOutfitWorn(id: string, wornAt: string = new Date().toISOString()): Promise<void> {
  await db.runAsync('UPDATE outfits SET worn_at = ? WHERE id = ?;', [wornAt, id]);
}

export async function toggleOutfitFavorite(id: string, favorite: boolean): Promise<void> {
  await db.runAsync('UPDATE outfits SET favorite = ? WHERE id = ?;', [favorite ? 1 : 0, id]);
}

export async function deleteOutfit(id: string): Promise<void> {
  await db.runAsync('DELETE FROM outfits WHERE id = ?;', [id]);
}

/** Deletes every logged/built outfit. Used by the "Clear wardrobe data" settings action. */
export async function deleteAllOutfits(): Promise<void> {
  await db.runAsync('DELETE FROM outfits;');
}
