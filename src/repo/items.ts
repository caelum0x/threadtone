/**
 * CRUD for wardrobe items. All queries are parameterized — no string
 * interpolation of user input into SQL.
 */
import { db } from '../db/client';
import { newId } from '../db/ids';
import type { ClothingItem, NewClothingItem } from '../lib/types';
import { type ItemRow, mapItemRow } from './rows';

export async function listItems(): Promise<ClothingItem[]> {
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY created_at DESC;');
  return rows.map(mapItemRow);
}

/**
 * Same as listItems() but excludes archived (off-season/stored) pieces.
 * Used by Today's suggestion and the manual outfit builder so stored items
 * stop being recommended without being deleted — see seasonal-archive.tsx.
 */
export async function listActiveItems(): Promise<ClothingItem[]> {
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items WHERE archived = 0 ORDER BY created_at DESC;');
  return rows.map(mapItemRow);
}

export async function getItem(id: string): Promise<ClothingItem | null> {
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?;', [id]);
  return row ? mapItemRow(row) : null;
}

export async function createItem(input: NewClothingItem): Promise<ClothingItem> {
  if (input.name.trim().length === 0) {
    throw new Error('Item name cannot be empty.');
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(input.colorHex)) {
    throw new Error(`Invalid color hex: ${input.colorHex}`);
  }

  const id = newId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO items (id, category, name, color_hex, color_name, pattern, formality, photo_uri, favorite, archived, purchase_price, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.category,
      input.name.trim(),
      input.colorHex,
      input.colorName,
      input.pattern,
      input.formality,
      input.photoUri,
      input.favorite ? 1 : 0,
      input.archived ? 1 : 0,
      input.purchasePrice,
      createdAt,
    ],
  );

  return { ...input, id, createdAt };
}

export async function updateItem(id: string, input: NewClothingItem): Promise<void> {
  if (input.name.trim().length === 0) {
    throw new Error('Item name cannot be empty.');
  }

  await db.runAsync(
    `UPDATE items
     SET category = ?, name = ?, color_hex = ?, color_name = ?, pattern = ?, formality = ?, photo_uri = ?, favorite = ?, purchase_price = ?
     WHERE id = ?;`,
    [
      input.category,
      input.name.trim(),
      input.colorHex,
      input.colorName,
      input.pattern,
      input.formality,
      input.photoUri,
      input.favorite ? 1 : 0,
      input.purchasePrice,
      id,
    ],
  );
}

export async function toggleItemFavorite(id: string, favorite: boolean): Promise<void> {
  await db.runAsync('UPDATE items SET favorite = ? WHERE id = ?;', [favorite ? 1 : 0, id]);
}

/** Moves an item in/out of seasonal storage — see seasonal-archive.tsx. */
export async function setItemArchived(id: string, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE items SET archived = ? WHERE id = ?;', [archived ? 1 : 0, id]);
}

export async function deleteItem(id: string): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?;', [id]);
}

/** Deletes every item row. Caller (settings.tsx) is responsible for cleaning up photo files first. */
export async function deleteAllItems(): Promise<void> {
  await db.runAsync('DELETE FROM items;');
}
