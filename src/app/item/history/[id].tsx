/**
 * A dedicated "worn on these dates" view for a single item — real data
 * already logged by the app (outfits.worn_at), just not previously surfaced
 * per-item. Linked from the item edit screen's "Wear history" row.
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ClothingItem, Outfit } from '../../../lib/types';
import { getItem } from '../../../repo/items';
import { listOutfits } from '../../../repo/outfits';
import { color, radius, space, type as textType } from '../../../theme/tokens';
import { EmptyState } from '../../../ui/EmptyState';
import { ChevronLeftIcon, ChevronRightIcon, LayersIcon } from '../../../ui/icons';
import { ItemThumbnail } from '../../../ui/ItemThumbnail';

export default function ItemWearHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [wornOutfits, setWornOutfits] = useState<Outfit[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [found, outfits] = await Promise.all([getItem(id), listOutfits()]);
    setItem(found);
    setWornOutfits(
      outfits
        .filter((outfit) => outfit.wornAt !== null && outfit.itemIds.includes(id))
        .sort((a, b) => (b.wornAt ?? '').localeCompare(a.wornAt ?? '')),
    );
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Wear history</Text>
        <View style={{ width: 24 }} />
      </View>
    ),
    [router],
  );

  if (loading || !item) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      {header}

      <View style={styles.itemRow}>
        <ItemThumbnail item={item} size={64} />
        <View style={{ marginLeft: space.sm }}>
          <Text style={[textType.bodyMedium, { color: color.text1 }]}>{item.name}</Text>
          <Text style={[textType.caption, { color: color.text3 }]}>
            Worn {wornOutfits.length} time{wornOutfits.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {wornOutfits.length === 0 ? (
        <EmptyState
          icon={<LayersIcon size={40} color={color.text3} />}
          title="Not worn yet"
          body="Log this piece from Today's outfit or an outfit you build, and it will show up here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {wornOutfits.map((outfit) => (
            <Pressable key={outfit.id} style={styles.row} onPress={() => router.push(`/outfit/${outfit.id}`)}>
              <Text style={[textType.body, { color: color.text1 }]}>
                {outfit.wornAt ? new Date(outfit.wornAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </Text>
              <ChevronRightIcon size={18} color={color.text3} />
            </Pressable>
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
  },
  list: {
    padding: space.lg,
    paddingTop: 0,
    gap: space.xs,
    paddingBottom: space.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
