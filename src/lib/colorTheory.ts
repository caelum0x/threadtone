/**
 * Real color-theory math for matching owned clothing items, not a random
 * shuffle. Everything here is pure and unit-testable (no native modules), so
 * it is imported by both the outfit generator and the on-screen "why this
 * works" explanations.
 *
 * References used while building this:
 * - Standard RGB->HSL conversion (hue in degrees, saturation/lightness in %).
 * - The classic color-wheel harmony rules: complementary (~180 degrees
 *   apart), analogous (neighbors within ~45 degrees), and triadic (~120
 *   degrees apart) all read as "intentional" to the eye; everything else in
 *   between reads as an accidental clash.
 * - Capsule-wardrobe styling convention: black, white, gray, navy, beige,
 *   and brown act as "neutrals" that pair safely with anything, which is why
 *   a photo of denim jeans and a white tee doesn't need a figure like pure
 *   hue math to look fine.
 */

export interface Hsl {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export function hexToHsl(hex: string): Hsl {
  const normalized = hex.replace('#', '').trim();
  const bigint = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized,
    16,
  );
  if (Number.isNaN(bigint)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * A color counts as a wardrobe "neutral" when it safely pairs with anything
 * rather than needing hue math. Covers true grayscale, near-black, near-white
 * / cream, the beige-to-brown family, and navy (which sits in the blue hue
 * range but reads as a neutral once lightness drops low enough).
 */
export function isNeutral({ h, s, l }: Hsl): boolean {
  if (s <= 12) return true; // true black / white / gray
  if (l <= 18 && s <= 45) return true; // near-black, incl. dark brown/navy
  if (l >= 90 && s <= 20) return true; // near-white / cream
  if (h >= 15 && h <= 45 && s <= 35 && l >= 22 && l <= 78) return true; // beige/tan/khaki/brown
  if (h >= 200 && h <= 250 && l <= 30) return true; // navy
  return false;
}

export type HarmonyKind = 'neutral' | 'monochrome' | 'analogous' | 'triadic' | 'complementary' | 'clashing';

/** Shortest distance between two hues on the 360-degree color wheel. */
function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export interface PairHarmony {
  kind: HarmonyKind;
  score: number; // 0..1, higher is a better pairing
}

/** Scores how well two colors pair, using real color-wheel relationships. */
export function pairHarmony(a: Hsl, b: Hsl): PairHarmony {
  const aNeutral = isNeutral(a);
  const bNeutral = isNeutral(b);

  if (aNeutral && bNeutral) return { kind: 'neutral', score: 0.9 };
  if (aNeutral || bNeutral) return { kind: 'neutral', score: 0.88 };

  const distance = hueDistance(a.h, b.h);
  if (distance <= 18) return { kind: 'monochrome', score: 0.85 };
  if (distance <= 45) return { kind: 'analogous', score: 0.9 };
  if (distance >= 150) return { kind: 'complementary', score: 0.95 };
  if (distance >= 100 && distance < 150) return { kind: 'triadic', score: 0.82 };
  return { kind: 'clashing', score: 0.38 };
}

const HARMONY_LABEL: Record<HarmonyKind, string> = {
  neutral: 'neutral base',
  monochrome: 'tonal match',
  analogous: 'analogous colors',
  triadic: 'triadic contrast',
  complementary: 'complementary contrast',
  clashing: 'clashing hues',
};

export function harmonyLabel(kind: HarmonyKind): string {
  return HARMONY_LABEL[kind];
}

/** Human color name for a hex swatch, shown in the UI next to the dot. */
export function nameColor(hex: string): string {
  const hsl = hexToHsl(hex);
  if (hsl.s <= 8) {
    if (hsl.l <= 10) return 'Black';
    if (hsl.l >= 92) return 'White';
    return hsl.l < 45 ? 'Charcoal' : 'Gray';
  }
  if (isNeutral(hsl)) {
    if (hsl.h >= 200 && hsl.h <= 250 && hsl.l <= 30) return 'Navy';
    if (hsl.l >= 78) return 'Cream';
    if (hsl.l <= 30) return 'Brown';
    return 'Beige';
  }
  const h = hsl.h;
  if (h < 15 || h >= 345) return 'Red';
  if (h < 45) return 'Orange';
  if (h < 70) return 'Yellow';
  if (h < 160) return 'Green';
  if (h < 200) return 'Teal';
  if (h < 260) return 'Blue';
  if (h < 290) return 'Purple';
  if (h < 345) return 'Pink';
  return 'Red';
}
