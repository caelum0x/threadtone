/**
 * Index into the full category x color matrix — every real cell the closet
 * can be browsed by, each showing its real item count from the wardrobe's
 * own SQLite rows (see repo/items.ts's countItemsByCategoryColorMatrix).
 * See closet/[category]/[color].tsx for the detail cell.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRESET_COLORS } from '../../lib/colorPalette';
import type { ClothingCategory } from '../../lib/types';
import { CLOTHING_CATEGORIES } from '../../lib/types';
import { countItemsByCategoryColorMatrix } from '../../repo/items';
import { color, space, type as textType } from '../../theme/tokens';
import { ColorDot } from '../../ui/ColorDot';
import { ChevronLeftIcon } from '../../ui/icons';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

export default function ClosetBrowseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setCounts(await countItemsByCategoryColorMatrix());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Browse by color</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {CLOTHING_CATEGORIES.map((category) => (
            <View key={category} style={styles.section}>
              <Text style={[textType.label, { color: color.text3 }]}>{CATEGORY_LABEL[category].toUpperCase()}</Text>
              <View style={styles.grid}>
                {PRESET_COLORS.map((preset) => {
                  const count = counts.get(`${category}:${preset.hex}`) ?? 0;
                  return (
                    <Pressable
                      key={preset.hex}
                      style={styles.cell}
                      accessibilityRole="button"
                      accessibilityLabel={`${CATEGORY_LABEL[category]}, ${preset.name}, ${count} item${count === 1 ? '' : 's'}`}
                      onPress={() => router.push(`/closet/${category}/${preset.hex.replace('#', '')}`)}
                    >
                      <ColorDot hex={preset.hex} size={28} />
                      <Text style={[textType.caption, { color: color.text1, marginTop: space.xxs }]} numberOfLines={1}>
                        {preset.name}
                      </Text>
                      <Text style={[textType.caption, { color: color.text3 }]}>{count}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  section: {
    marginTop: space.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.sm,
  },
  cell: {
    width: 64,
    alignItems: 'center',
  },
});
