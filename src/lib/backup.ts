/**
 * Full on-device backup/export + import.
 *
 * Real gap this zero-backend app had (see plans/threadtone-architecture.md
 * §11): wardrobe photos and data live ONLY in the app's SQLite file and
 * document directory — no account, no cloud, no sync. If the phone is
 * lost, reset, or the app is deleted/reinstalled, every photographed item
 * and logged outfit is gone forever with no way to recover it.
 *
 * This produces one self-contained JSON file — photos embedded as base64,
 * so no zip library or extra native module beyond the already-installed
 * expo-file-system/expo-sharing/expo-document-picker is needed — that the
 * user can save via the system share sheet (Files/iCloud Drive/AirDrop/
 * email) and re-import later. Import always MERGES: every item/outfit gets
 * a brand-new id and outfit item-id references are remapped, so importing
 * the same backup twice (or onto a phone that already has data) can never
 * silently overwrite or delete anything already on the device.
 */
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { newId } from '../db/ids';
import { getCurrencySymbol } from '../repo/appMeta';
import { createItem, listItems } from '../repo/items';
import { createOutfit, listOutfits } from '../repo/outfits';
import { persistItemPhoto } from './photoStorage';
import type { ClothingCategory, ClothingItem, Formality, NewClothingItem, NewOutfit, Pattern } from './types';

const BACKUP_FORMAT_VERSION = 1;
const BACKUP_FORMAT_TAG = 'wearday-backup';

export interface BackupItem {
  id: string;
  category: string;
  name: string;
  colorHex: string;
  colorName: string;
  pattern: string;
  formality: string;
  favorite: boolean;
  archived: boolean;
  purchasePrice: number | null;
  createdAt: string;
  photoBase64: string | null;
  photoExtension: string | null;
}

export interface BackupOutfit {
  id: string;
  itemIds: string[];
  note: string | null;
  favorite: boolean;
  wornAt: string | null;
  createdAt: string;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT_TAG;
  version: number;
  exportedAt: string;
  currencySymbol: string;
  items: BackupItem[];
  outfits: BackupOutfit[];
}

export interface ImportSummary {
  itemsImported: number;
  outfitsImported: number;
  itemsSkipped: number;
}

async function photoToBase64(photoUri: string | null): Promise<{ photoBase64: string | null; photoExtension: string | null }> {
  if (!photoUri) return { photoBase64: null, photoExtension: null };
  try {
    const file = new File(photoUri);
    if (!file.exists) return { photoBase64: null, photoExtension: null };
    const base64 = await file.base64();
    const extensionMatch = photoUri.match(/\.(\w+)$/);
    return { photoBase64: base64, photoExtension: extensionMatch ? extensionMatch[1] : 'jpg' };
  } catch {
    // A missing/corrupt photo file shouldn't block exporting the rest of the wardrobe.
    return { photoBase64: null, photoExtension: null };
  }
}

/** Builds the full backup payload in memory. Exported for reuse/testing. */
export async function buildBackup(): Promise<BackupFile> {
  const [items, outfits, currencySymbol] = await Promise.all([listItems(), listOutfits(), getCurrencySymbol()]);

  const backupItems: BackupItem[] = [];
  for (const item of items) {
    const { photoBase64, photoExtension } = await photoToBase64(item.photoUri);
    backupItems.push({
      id: item.id,
      category: item.category,
      name: item.name,
      colorHex: item.colorHex,
      colorName: item.colorName,
      pattern: item.pattern,
      formality: item.formality,
      favorite: item.favorite,
      archived: item.archived,
      purchasePrice: item.purchasePrice,
      createdAt: item.createdAt,
      photoBase64,
      photoExtension,
    });
  }

  const backupOutfits: BackupOutfit[] = outfits.map((outfit) => ({
    id: outfit.id,
    itemIds: outfit.itemIds,
    note: outfit.note,
    favorite: outfit.favorite,
    wornAt: outfit.wornAt,
    createdAt: outfit.createdAt,
  }));

  return {
    format: BACKUP_FORMAT_TAG,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    currencySymbol,
    items: backupItems,
    outfits: backupOutfits,
  };
}

function backupFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `wearday-backup-${stamp}.json`;
}

/**
 * Writes a full backup to a temp file and opens the system share sheet so
 * the user can save it to Files/iCloud Drive, AirDrop it, or email it to
 * themselves. Returns the file uri that was written (useful for callers
 * that want to confirm something was actually produced).
 */
export async function exportBackup(): Promise<string> {
  const backup = await buildBackup();
  const dir = new Directory(Paths.cache, 'wearday-backups');
  if (!dir.exists) dir.create({ intermediates: true });

  const file = new File(dir, backupFileName());
  if (file.exists) file.delete();
  await file.write(JSON.stringify(backup), { encoding: 'utf8' });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your Wearday backup',
      UTI: 'public.json',
    });
  }

  return file.uri;
}

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.format === BACKUP_FORMAT_TAG &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.outfits)
  );
}

const VALID_CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];
const VALID_PATTERNS: Pattern[] = ['solid', 'striped', 'plaid', 'floral', 'graphic', 'textured'];
const VALID_FORMALITY: Formality[] = ['casual', 'smart-casual', 'formal'];

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Rejects a malformed backup item rather than inserting bad data (never trust external file content). */
function isValidBackupItem(value: unknown): value is BackupItem {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    VALID_CATEGORIES.includes(candidate.category as ClothingCategory) &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    isHexColor(candidate.colorHex) &&
    typeof candidate.colorName === 'string' &&
    VALID_PATTERNS.includes(candidate.pattern as Pattern) &&
    VALID_FORMALITY.includes(candidate.formality as Formality) &&
    typeof candidate.favorite === 'boolean' &&
    typeof candidate.archived === 'boolean'
  );
}

/**
 * Reads a backup JSON file (from a uri the caller already resolved, e.g.
 * via expo-document-picker) and merges it into the current wardrobe.
 */
export async function importBackup(fileUri: string): Promise<ImportSummary> {
  const file = new File(fileUri);
  const raw = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('That file is not a valid Wearday backup (not JSON).');
  }

  if (!isBackupFile(parsed)) {
    throw new Error('That file is not a valid Wearday backup.');
  }
  if (parsed.version > BACKUP_FORMAT_VERSION) {
    throw new Error('This backup was made with a newer version of Wearday. Update the app and try again.');
  }

  const idMap = new Map<string, string>();
  let itemsSkipped = 0;

  for (const backupItem of parsed.items) {
    if (!isValidBackupItem(backupItem)) {
      itemsSkipped += 1;
      continue;
    }

    let photoUri: string | null = null;
    if (backupItem.photoBase64) {
      let tempFile: File | null = null;
      try {
        const tempDir = new Directory(Paths.cache, 'wearday-import');
        if (!tempDir.exists) tempDir.create({ intermediates: true });
        tempFile = new File(tempDir, `${newId()}.${backupItem.photoExtension ?? 'jpg'}`);
        await tempFile.write(backupItem.photoBase64, { encoding: 'base64' });
        photoUri = await persistItemPhoto(tempFile.uri);
      } catch {
        // A photo that fails to decode shouldn't block importing the item itself.
        photoUri = null;
      } finally {
        if (tempFile?.exists) tempFile.delete();
      }
    }

    const newItem: NewClothingItem = {
      category: backupItem.category as ClothingItem['category'],
      name: backupItem.name,
      colorHex: backupItem.colorHex,
      colorName: backupItem.colorName,
      pattern: backupItem.pattern as ClothingItem['pattern'],
      formality: backupItem.formality as ClothingItem['formality'],
      photoUri,
      favorite: backupItem.favorite,
      archived: backupItem.archived,
      purchasePrice: typeof backupItem.purchasePrice === 'number' ? backupItem.purchasePrice : null,
    };

    const created = await createItem(newItem);
    idMap.set(backupItem.id, created.id);
  }

  let outfitsImported = 0;
  for (const backupOutfit of parsed.outfits) {
    if (!Array.isArray(backupOutfit.itemIds)) continue;
    const remappedItemIds = backupOutfit.itemIds.map((id) => idMap.get(id)).filter((id): id is string => Boolean(id));
    if (remappedItemIds.length === 0) continue;

    const newOutfit: NewOutfit = {
      itemIds: remappedItemIds,
      note: typeof backupOutfit.note === 'string' ? backupOutfit.note : null,
      favorite: Boolean(backupOutfit.favorite),
      wornAt: typeof backupOutfit.wornAt === 'string' ? backupOutfit.wornAt : null,
    };
    await createOutfit(newOutfit);
    outfitsImported += 1;
  }

  return { itemsImported: idMap.size, outfitsImported, itemsSkipped };
}
