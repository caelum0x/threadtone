/**
 * Seasonal archive: move off-season pieces out of Today's daily suggestion
 * and the manual outfit builder (both now call repo/items.ts's
 * listActiveItems()) without deleting them. Toggling is instant and
 * optimistic, same pattern as the favorite star elsewhere in the app.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ClothingItem } from '../lib/types';
import { listItems, setItemArchived } from '../repo/items';
import { color, radius, space, type as textType } from '../theme/tokens';
import { EmptyState } from '../ui/EmptyState';
import { ArchiveIcon, ChevronLeftIcon } from '../ui/icons';
import { ItemThumbnail } from '../ui/ItemThumbnail';

export default function SeasonalArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClothingItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await listItems());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const active = useMemo(() => items.filter((i) => !i.archived), [items]);
  const archived = useMemo(() => items.filter((i) => i.archived), [items]);

  async function handleToggle(item: ClothingItem) {
    const nextArchived = !item.archived;
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, archived: nextArchived } : i)));
    await setItemArchived(item.id, nextArchived);
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Seasonal archive</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ArchiveIcon size={40} color={color.text3} />}
          title="Nothing to archive yet"
          body="Add items to your wardrobe first. Off-season pieces you store away can be moved here later."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[textType.caption, { color: color.text3 }]}>
            Archived pieces stay in your wardrobe but drop out of Today&apos;s suggestions and the outfit builder — handy
            for off-season storage.
          </Text>

          <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>ACTIVE ({active.length})</Text>
          {active.length === 0 ? (
            <Text style={[textType.caption, { color: color.text3, marginTop: space.xs }]}>Everything is archived.</Text>
          ) : (
            active.map((item) => (
              <Pressable key={item.id} style={styles.row} onPress={() => void handleToggle(item)}>
                <ItemThumbnail item={item} size={48} />
                <Text style={[textType.body, { color: color.text1, flex: 1, marginLeft: space.sm }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <ArchiveIcon size={20} color={color.text3} />
              </Pressable>
            ))
          )}

          <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>ARCHIVED ({archived.length})</Text>
          {archived.length === 0 ? (
            <Text style={[textType.caption, { color: color.text3, marginTop: space.xs }]}>Nothing archived right now.</Text>
          ) : (
            archived.map((item) => (
              <Pressable key={item.id} style={styles.row} onPress={() => void handleToggle(item)}>
                <ItemThumbnail item={item} size={48} />
                <Text style={[textType.body, { color: color.text2, flex: 1, marginLeft: space.sm }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <ArchiveIcon size={20} color={color.accent} filled />
              </Pressable>
            ))
          )}
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
  row: {
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
