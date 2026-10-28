/**
 * Local, zero-cost dominant-color detection for a just-captured item photo.
 * Uses react-native-image-colors (MIT, on-device, no network call, no API
 * key) instead of a paid vision API. This is a convenience default — the
 * user always sees and can override the result from the manual palette, so
 * a wrong guess never blocks adding an item.
 *
 * The native module is required lazily, inside the function, rather than as
 * a top-level `import`. A top-level import gets evaluated the moment any
 * file that imports this module is evaluated — including by Expo Router's
 * eager static evaluation of every route under src/app/ to build its route
 * tree, which can run before the native module registry has finished
 * warming up. A real cold-start repro on 2026-10-28 (first on-device build
 * after the Wearday rename) hit exactly that: `requireNativeModule`
 * resolving `ImageColors` before it was ready, which (as a top-level
 * import) threw *outside* the try/catch below, crashed the eager evaluation
 * of item/new.tsx, and broke the whole route tree. Requiring it lazily
 * inside the function defers resolution until the user actually takes/picks
 * a photo, and keeps any resolution failure inside the existing try/catch
 * so it always degrades to "no detected color" instead of crashing.
 */
import { Platform } from 'react-native';

export async function detectDominantColor(photoUri: string): Promise<string | null> {
  try {
    const { getColors } = await import('react-native-image-colors');
    const result = await getColors(photoUri, { fallback: '#8A8D91', cache: false, quality: 'low' });

    if (result.platform === 'android') {
      return result.dominant ?? result.average ?? result.vibrant ?? null;
    }
    if (result.platform === 'ios') {
      return result.primary ?? result.background ?? null;
    }
    return null;
  } catch {
    // Local detection is a convenience, never a requirement — the manual
    // palette is always available if this fails on a given device.
    return null;
  }
}

export const isColorDetectionSupported = Platform.OS === 'ios' || Platform.OS === 'android';
