import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ClothingItem, Outfit } from '../../lib/types';
import { listItems } from '../../repo/items';
import { listOutfits } from '../../repo/outfits';
import { color, radius, space, type as textType } from '../../theme/tokens';
import { EmptyState } from '../../ui/EmptyState';
import { ItemThumbnail } from '../../ui/ItemThumbnail';
import { LayersIcon, PlusIcon, StarIcon } from '../../ui/icons';

interface OutfitWithItems {
  outfit: Outfit;
  items: ClothingItem[];
}

export default function OutfitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OutfitWithItems[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [outfits, items] = await Promise.all([listOutfits(), listItems()]);
    const itemById = new Map(items.map((item) => [item.id, item]));
    setRows(
      outfits.map((outfit) => ({
        outfit,
        items: outfit.itemIds.map((id) => itemById.get(id)).filter((item): item is ClothingItem => item !== undefined),
      })),
    );
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
        <Text style={textType.title}>Outfits</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Build an outfit"
          style={styles.addButton}
          onPress={() => router.push('/outfit/build')}
        >
          <PlusIcon size={20} color={color.accentFg} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<LayersIcon size={40} color={color.text3} />}
          title="No outfits yet"
          body="Outfits you build or log from Today's suggestion will show up here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {rows.map(({ outfit, items }) => (
            <Pressable key={outfit.id} style={styles.card} onPress={() => router.push(`/outfit/${outfit.id}`)}>
              <View style={styles.thumbs}>
                {items.slice(0, 4).map((item) => (
                  <ItemThumbnail key={item.id} item={item} size={56} />
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textType.bodyMedium, { color: color.text1 }]}>
                  {items.length} piece{items.length === 1 ? '' : 's'}
                </Text>
                <Text style={[textType.caption, { color: color.text3 }]}>
                  {outfit.wornAt
                    ? `Worn ${new Date(outfit.wornAt).toLocaleDateString()}`
                    : `Built ${new Date(outfit.createdAt).toLocaleDateString()}`}
                </Text>
              </View>
              {outfit.favorite ? <StarIcon size={16} color={color.accent} filled /> : null}
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
    paddingTop: space.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: space.lg,
    gap: space.sm,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: color.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.sm,
  },
  thumbs: {
    flexDirection: 'row',
    gap: 4,
  },
});
