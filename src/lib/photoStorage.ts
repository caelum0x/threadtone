/**
 * Copies a captured/picked item photo into the app's document directory so
 * it survives after the camera/picker's temporary cache file is cleared.
 * Same pattern as ecomoney's receipt photo storage.
 */
import { Directory, File, Paths } from 'expo-file-system';

const ITEMS_DIR_NAME = 'wardrobe-items';

export async function persistItemPhoto(sourceUri: string): Promise<string> {
  const dir = new Directory(Paths.document, ITEMS_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });

  const extensionMatch = sourceUri.match(/\.(\w+)$/);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';
  const destination = new File(dir, `${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`);

  const source = new File(sourceUri);
  await source.copy(destination);
  return destination.uri;
}

/** Best-effort cleanup when an item is deleted or replaced; never throws. */
export function deleteItemPhoto(uri: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Non-fatal: an orphaned photo file costs nothing worth crashing over.
  }
}
