import { Image, StyleSheet, View } from 'react-native';

import type { ClothingItem } from '../lib/types';
import { color, radius } from '../theme/tokens';
import { HangerIcon } from './icons';

interface ItemThumbnailProps {
  item: Pick<ClothingItem, 'photoUri' | 'colorHex'>;
  size?: number;
}

/** Shows the item's real photo when one exists, else a tinted swatch card. */
export function ItemThumbnail({ item, size = 72 }: ItemThumbnailProps) {
  const style = [styles.base, { width: size, height: size }];

  if (item.photoUri) {
    return <Image source={{ uri: item.photoUri }} style={[...style, styles.image]} resizeMode="cover" />;
  }

  return (
    <View style={[...style, styles.swatch, { backgroundColor: item.colorHex }]}>
      <HangerIcon size={size * 0.38} color={swatchIconColor(item.colorHex)} strokeWidth={1.6} />
    </View>
  );
}

/** Picks a readable icon tint against the swatch background (dark on light, light on dark). */
function swatchIconColor(hex: string): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0A0B0D' : '#F7F8F8';
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  image: {
    backgroundColor: color.surface2,
  },
  swatch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
