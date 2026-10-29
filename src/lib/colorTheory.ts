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
  // Near-white/cream: HSL's saturation formula inflates sharply as lightness
  // approaches 100 (small denominator), so even a barely-tinted near-white
  // can read as s=20-plus. A real off-white (#F5F5F0, s=20) and a real cream
  // (#F2E6D8, s=50) both need to clear this, not just true grayscale whites.
  if (l >= 88 && s <= 55) return true;
  // Beige/tan/khaki/brown family. Saturation genuinely runs higher for the
  // same perceived "muted warm neutral" as lightness drops (a leather-brown
  // like #5B3A29 computes s=38, well above a pale khaki's s=29), so the
  // ceiling is widened for the darker half of the band rather than using one
  // flat cutoff across the whole 19-78 lightness range.
  if (h >= 15 && h <= 45 && l >= 19 && l <= 78) {
    const maxSaturation = l <= 40 ? 50 : 35;
    if (s <= maxSaturation) return true;
  }
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
  // Matches isNeutral's own "true black / white / gray" cutoff (s <= 12) —
  // this used to be a stricter s <= 8, which let a real charcoal like
  // #2E3238 (s=10) slip past this shortcut and get caught by the navy
  // hue-range check below instead, mislabeling it "Navy".
  if (hsl.s <= 12) {
    if (hsl.l <= 10) return 'Black';
    if (hsl.l >= 92) return 'White';
    return hsl.l < 45 ? 'Charcoal' : 'Gray';
  }
  if (isNeutral(hsl)) {
    if (hsl.h >= 200 && hsl.h <= 250 && hsl.l <= 30) return 'Navy';
    // A near-white with a faint warm tint (#F5F5F0: l=95, s=20) should still
    // read as "White", not "Cream" — only the more visibly tinted, lower-
    // saturation-but-still-pale tones (#F2E6D8: l=90, s=50) are "Cream".
    if (hsl.l >= 90 && hsl.s <= 30) return 'White';
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
