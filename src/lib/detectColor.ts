/**
 * Local, zero-cost dominant-color detection for a just-captured item photo.
 * Uses react-native-image-colors (MIT, on-device, no network call, no API
 * key) instead of a paid vision API. This is a convenience default — the
 * user always sees and can override the result from the manual palette, so
 * a wrong guess never blocks adding an item.
 */
import { getColors } from 'react-native-image-colors';
import { Platform } from 'react-native';

export async function detectDominantColor(photoUri: string): Promise<string | null> {
  try {
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
