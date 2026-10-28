/**
 * Shared domain types for the wardrobe. Kept in one place so the DB layer,
 * the color-theory engine, and the UI all agree on the same shapes.
 */

export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory';

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'accessory',
];

export type Pattern = 'solid' | 'striped' | 'plaid' | 'floral' | 'graphic' | 'textured';

export const PATTERNS: Pattern[] = ['solid', 'striped', 'plaid', 'floral', 'graphic', 'textured'];

export type Formality = 'casual' | 'smart-casual' | 'formal';

export const FORMALITY_LEVELS: Formality[] = ['casual', 'smart-casual', 'formal'];

export interface ClothingItem {
  id: string;
  category: ClothingCategory;
  name: string;
  colorHex: string;
  colorName: string;
  pattern: Pattern;
  formality: Formality;
  photoUri: string | null;
  favorite: boolean;
  /** Off-season/stored pieces: still owned, excluded from Today's suggestions and the outfit builder. */
  archived: boolean;
  /** Optional price paid, used for cost-per-wear in Insights. Null when not entered. */
  purchasePrice: number | null;
  createdAt: string;
}

export type NewClothingItem = Omit<ClothingItem, 'id' | 'createdAt'>;

export interface Outfit {
  id: string;
  itemIds: string[];
  note: string | null;
  favorite: boolean;
  wornAt: string | null;
  createdAt: string;
}

export type NewOutfit = Omit<Outfit, 'id' | 'createdAt'>;

/** An outfit suggestion produced by the generator, with its own scoring. */
export interface OutfitSuggestion {
  items: ClothingItem[];
  score: number;
  reasons: string[];
}
