/**
 * A curated set of real clothing colors for manual tagging. Names come from
 * colorTheory.nameColor so the palette never drifts out of sync with the
 * harmony engine's own color naming.
 */
import { nameColor } from './colorTheory';

const PRESET_HEX: string[] = [
  '#0B0B0D', // black
  '#F5F5F0', // white
  '#8A8D91', // gray
  '#2E3238', // charcoal
  '#14233B', // navy
  '#3B5B82', // denim blue
  '#C8B89A', // beige
  '#5B3A29', // brown
  '#F2E6D8', // cream
  '#B23A2E', // red
  '#6E1F26', // maroon
  '#D97B29', // orange
  '#D9B23C', // mustard
  '#56682E', // olive
  '#1F5C3C', // forest green
  '#1F7A72', // teal
  '#6FA8D9', // sky blue
  '#2A4FA0', // royal blue
  '#5B3F8C', // purple
  '#D98CAE', // pink
];

export interface PresetColor {
  hex: string;
  name: string;
}

export const PRESET_COLORS: PresetColor[] = PRESET_HEX.map((hex) => ({ hex, name: nameColor(hex) }));
