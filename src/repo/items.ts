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
    `INSERT INTO items (id, category, name, color_hex, color_name, pattern, formality, photo_uri, favorite, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
     SET category = ?, name = ?, color_hex = ?, color_name = ?, pattern = ?, formality = ?, photo_uri = ?, favorite = ?
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
      id,
    ],
  );
}

export async function toggleItemFavorite(id: string, favorite: boolean): Promise<void> {
  await db.runAsync('UPDATE items SET favorite = ? WHERE id = ?;', [favorite ? 1 : 0, id]);
}

export async function deleteItem(id: string): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?;', [id]);
}
