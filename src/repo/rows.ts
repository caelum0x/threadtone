/**
 * Raw SQLite row shapes and the mappers that turn them into domain types.
 * Kept separate from the repo functions so the "untrusted external data"
 * boundary (a SQLite row is just as untrusted as any other I/O boundary) is
 * explicit and in one place.
 */
import type { ClothingCategory, ClothingItem, Formality, Outfit, Pattern } from '../lib/types';

export interface ItemRow {
  id: string;
  category: string;
  name: string;
  color_hex: string;
  color_name: string;
  pattern: string;
  formality: string;
  photo_uri: string | null;
  favorite: number;
  created_at: string;
}

export interface OutfitRow {
  id: string;
  item_ids: string;
  note: string | null;
  favorite: number;
  worn_at: string | null;
  created_at: string;
}

export function mapItemRow(row: ItemRow): ClothingItem {
  return {
    id: row.id,
    category: row.category as ClothingCategory,
    name: row.name,
    colorHex: row.color_hex,
    colorName: row.color_name,
    pattern: row.pattern as Pattern,
    formality: row.formality as Formality,
    photoUri: row.photo_uri,
    favorite: row.favorite === 1,
    createdAt: row.created_at,
  };
}

export function mapOutfitRow(row: OutfitRow): Outfit {
  let itemIds: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.item_ids);
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
      itemIds = parsed;
    }
  } catch {
    itemIds = [];
  }

  return {
    id: row.id,
    itemIds,
    note: row.note,
    favorite: row.favorite === 1,
    wornAt: row.worn_at,
    createdAt: row.created_at,
  };
}
