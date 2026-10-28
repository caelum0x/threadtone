/**
 * Wardrobe analytics computed entirely from data the app already has: no new
 * tracking, no network call. Most/least-worn and wear-frequency-by-month
 * come from outfits.worn_at; cost-per-wear from the optional purchase_price
 * field (see item/new.tsx, item/[id].tsx); closet gaps from a simple
 * category count. Flat SQL reads, pure JS aggregation, same pattern as the
 * rest of the repo layer.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findClosetGaps } from '../lib/shoppingGaps';
import type { ClothingCategory, ClothingItem, Outfit } from '../lib/types';
import { getCurrencySymbol } from '../repo/appMeta';
import { listItems } from '../repo/items';
import { listOutfits } from '../repo/outfits';
import { color, radius, space, type as textType } from '../theme/tokens';
import { EmptyState } from '../ui/EmptyState';
import { ChartIcon, ChevronLeftIcon } from '../ui/icons';
import { ItemThumbnail } from '../ui/ItemThumbnail';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

function countWornTimes(items: ClothingItem[], outfits: Outfit[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.id, 0);
  for (const outfit of outfits) {
    if (!outfit.wornAt) continue;
    for (const itemId of outfit.itemIds) {
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
  }
  return counts;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' });
}

function wearsByMonth(outfits: Outfit[], months = 6): { key: string; count: number }[] {
  const now = new Date();
  const buckets: { key: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, count: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const outfit of outfits) {
    if (!outfit.wornAt) continue;
    const d = new Date(outfit.wornAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currencySymbol, setCurrencySymbolState] = useState('$');

  const load = useCallback(async () => {
    setLoading(true);
    const [loadedItems, loadedOutfits, symbol] = await Promise.all([listItems(), listOutfits(), getCurrencySymbol()]);
    setItems(loadedItems);
    setOutfits(loadedOutfits);
    setCurrencySymbolState(symbol);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const wornCounts = useMemo(() => countWornTimes(items, outfits), [items, outfits]);

  const mostWorn = useMemo(
    () => [...items].filter((i) => (wornCounts.get(i.id) ?? 0) > 0).sort((a, b) => (wornCounts.get(b.id) ?? 0) - (wornCounts.get(a.id) ?? 0)).slice(0, 5),
    [items, wornCounts],
  );

  const neverWorn = useMemo(() => items.filter((i) => (wornCounts.get(i.id) ?? 0) === 0).slice(0, 5), [items, wornCounts]);

  const costPerWear = useMemo(
    () =>
      items
        .filter((i): i is ClothingItem & { purchasePrice: number } => i.purchasePrice !== null)
        .map((i) => ({ item: i, cost: i.purchasePrice / Math.max(1, wornCounts.get(i.id) ?? 0) }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5),
    [items, wornCounts],
  );

  const closetGaps = useMemo(() => findClosetGaps(items).filter((g) => g.severity !== 'fine'), [items]);
  const monthBuckets = useMemo(() => wearsByMonth(outfits), [outfits]);
  const maxMonthCount = Math.max(1, ...monthBuckets.map((b) => b.count));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        {renderHeader(router)}
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        {renderHeader(router)}
        <EmptyState
          icon={<ChartIcon size={40} color={color.text3} />}
          title="Nothing to analyze yet"
          body="Add a few items to your wardrobe to see wear stats and closet gaps here."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      {renderHeader(router)}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[textType.label, { color: color.text3 }]}>WEAR ACTIVITY, LAST 6 MONTHS</Text>
        <View style={styles.barChart}>
          {monthBuckets.map((bucket) => (
            <View key={bucket.key} style={styles.barColumn}>
              <View style={[styles.bar, { height: 8 + (bucket.count / maxMonthCount) * 72 }]} />
              <Text style={[textType.caption, { color: color.text3, marginTop: space.xxs }]}>{monthLabel(bucket.key)}</Text>
            </View>
          ))}
        </View>

        {mostWorn.length > 0 ? (
          <>
            <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>MOST WORN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {mostWorn.map((item) => (
                <View key={item.id} style={styles.thumbCell}>
                  <ItemThumbnail item={item} size={64} />
                  <Text style={[textType.caption, { color: color.text2, marginTop: space.xxs }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[textType.caption, { color: color.text3 }]}>{wornCounts.get(item.id)} wears</Text>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {neverWorn.length > 0 ? (
          <>
            <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>NOT WORN YET</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {neverWorn.map((item) => (
                <View key={item.id} style={styles.thumbCell}>
                  <ItemThumbnail item={item} size={64} />
                  <Text style={[textType.caption, { color: color.text2, marginTop: space.xxs }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {costPerWear.length > 0 ? (
          <>
            <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>COST PER WEAR</Text>
            {costPerWear.map(({ item, cost }) => (
              <View key={item.id} style={styles.listRow}>
                <ItemThumbnail item={item} size={40} />
                <Text style={[textType.body, { color: color.text1, flex: 1, marginLeft: space.sm }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[textType.bodyMedium, { color: color.text2 }]}>
                  {currencySymbol}
                  {cost.toFixed(2)}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {closetGaps.length > 0 ? (
          <>
            <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>CLOSET GAPS</Text>
            {closetGaps.map((gap) => (
              <View key={gap.category} style={styles.listRow}>
                <Text style={[textType.body, { color: color.text1, flex: 1 }]}>{CATEGORY_LABEL[gap.category]}</Text>
                <Text style={[textType.caption, { color: gap.severity === 'missing' ? color.negative : color.warning }]}>
                  {gap.count === 0 ? 'None yet' : 'Only 1'}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function renderHeader(router: ReturnType<typeof useRouter>) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
        <ChevronLeftIcon color={color.text1} />
      </Pressable>
      <Text style={textType.heading}>Insights</Text>
      <View style={{ width: 24 }} />
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
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: space.md,
    height: 100,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 16,
    borderRadius: radius.sm,
    backgroundColor: color.accent,
  },
  thumbRow: {
    gap: space.sm,
    marginTop: space.sm,
  },
  thumbCell: {
    width: 72,
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
