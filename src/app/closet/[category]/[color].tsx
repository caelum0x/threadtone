/**
 * Real closet-browse detail: every owned item in one category+color cell,
 * plus real pairing suggestions computed against the rest of the active
 * closet with the same color-harmony math used by the outfit generator.
 * One dynamic route backs the full 6 category x 20 color matrix reachable
 * from closet/browse.tsx.
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hexToHsl, harmonyLabel, pairHarmony } from '../../../lib/colorTheory';
import type { ClothingCategory, ClothingItem } from '../../../lib/types';
import { CLOTHING_CATEGORIES } from '../../../lib/types';
import { listActiveItems, listItemsByCategoryAndColor } from '../../../repo/items';
import { color, radius, space, type as textType } from '../../../theme/tokens';
import { ColorDot } from '../../../ui/ColorDot';
import { EmptyState } from '../../../ui/EmptyState';
import { ChevronLeftIcon, GridIcon } from '../../../ui/icons';
import { ItemThumbnail } from '../../../ui/ItemThumbnail';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

const HEX_SEGMENT = /^[0-9a-fA-F]{6}$/;

export default function ClosetCategoryColorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category, color: colorParam } = useLocalSearchParams<{ category: string; color: string }>();

  const validCategory = CLOTHING_CATEGORIES.includes(category as ClothingCategory)
    ? (category as ClothingCategory)
    : null;
  const colorHex =
    typeof colorParam === 'string' && HEX_SEGMENT.test(colorParam) ? `#${colorParam.toLowerCase()}` : null;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [restOfCloset, setRestOfCloset] = useState<ClothingItem[]>([]);

  const load = useCallback(async () => {
    if (!validCategory || !colorHex) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [cellItems, active] = await Promise.all([
      listItemsByCategoryAndColor(validCategory, colorHex),
      listActiveItems(),
    ]);
    setItems(cellItems);
    setRestOfCloset(active);
    setLoading(false);
  }, [validCategory, colorHex]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const pairings = useMemo(() => {
    if (!colorHex || !validCategory) return [];
    const targetHsl = hexToHsl(colorHex);
    const cellItemIds = new Set(items.map((item) => item.id));
    return restOfCloset
      .filter((other) => !cellItemIds.has(other.id) && other.category !== validCategory)
      .map((other) => ({ item: other, harmony: pairHarmony(targetHsl, hexToHsl(other.colorHex)) }))
      .sort((a, b) => b.harmony.score - a.harmony.score)
      .slice(0, 8);
  }, [items, restOfCloset, colorHex, validCategory]);

  if (!validCategory || !colorHex) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: color.bg }]}>
        <Text style={[textType.body, { color: color.text2 }]}>This closet cell doesn&apos;t exist.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <View style={styles.headerTitle}>
          <ColorDot hex={colorHex} size={16} />
          <Text style={[textType.heading, { marginLeft: space.xs }]} numberOfLines={1}>
            {CATEGORY_LABEL[validCategory]}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<GridIcon size={40} color={color.text3} />}
          title="You don't own any of these yet"
          body={`No ${CATEGORY_LABEL[validCategory].toLowerCase()} in this color are in your closet.`}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[textType.label, { color: color.text3 }]}>
            {items.length} ITEM{items.length === 1 ? '' : 'S'}
          </Text>
          <View style={styles.grid}>
            {items.map((item) => (
              <Pressable key={item.id} style={styles.cell} onPress={() => router.push(`/item/${item.id}`)}>
                <ItemThumbnail item={item} size={100} />
                <Text style={[textType.caption, { color: color.text1, marginTop: space.xxs }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {pairings.length > 0 ? (
            <>
              <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>PAIRS WELL WITH</Text>
              {pairings.map(({ item, harmony }) => (
                <View key={item.id} style={styles.listRow}>
                  <ItemThumbnail item={item} size={44} />
                  <View style={{ flex: 1, marginLeft: space.sm }}>
                    <Text style={[textType.body, { color: color.text1 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[textType.caption, { color: color.text3 }]}>{harmonyLabel(harmony.kind)}</Text>
                  </View>
                  <Text style={[textType.caption, { color: color.text3 }]}>{Math.round(harmony.score * 100)}%</Text>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.sm,
  },
  cell: {
    width: 100,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.sm,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
