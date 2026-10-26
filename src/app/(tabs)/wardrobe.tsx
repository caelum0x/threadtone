import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ClothingCategory, ClothingItem } from '../../lib/types';
import { CLOTHING_CATEGORIES } from '../../lib/types';
import { listItems } from '../../repo/items';
import { color, radius, space, type as textType } from '../../theme/tokens';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { GridIcon, PlusIcon, StarIcon } from '../../ui/icons';
import { ItemThumbnail } from '../../ui/ItemThumbnail';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ClothingCategory | 'all' | 'favorites'>('all');

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

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return items;
    if (categoryFilter === 'favorites') return items.filter((item) => item.favorite);
    return items.filter((item) => item.category === categoryFilter);
  }, [items, categoryFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={textType.title}>Wardrobe</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add item"
          style={styles.addButton}
          onPress={() => router.push('/item/new')}
        >
          <PlusIcon size={20} color={color.accentFg} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        <Chip label="All" selected={categoryFilter === 'all'} onPress={() => setCategoryFilter('all')} />
        <Chip label="Favorites" selected={categoryFilter === 'favorites'} onPress={() => setCategoryFilter('favorites')} />
        {CLOTHING_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={CATEGORY_LABEL[category]}
            selected={categoryFilter === category}
            onPress={() => setCategoryFilter(category)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<GridIcon size={40} color={color.text3} />}
          title="Your wardrobe is empty"
          body="Photograph or pick a photo of a clothing item to start building outfits from pieces you own."
          actionAccessibilityLabel="Add your first item"
          onAction={() => router.push('/item/new')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GridIcon size={40} color={color.text3} />}
          title="Nothing here yet"
          body="No items match this filter."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {filtered.map((item) => (
            <Pressable key={item.id} style={styles.cell} onPress={() => router.push(`/item/${item.id}`)}>
              <View>
                <ItemThumbnail item={item} size={108} />
                {item.favorite ? (
                  <View style={styles.favoriteBadge}>
                    <StarIcon size={14} color={color.accent} filled />
                  </View>
                ) : null}
              </View>
              <Text style={[textType.caption, { color: color.text1, marginTop: space.xxs }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[textType.caption, { color: color.text3 }]} numberOfLines={1}>
                {CATEGORY_LABEL[item.category]}
              </Text>
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
  filters: {
    marginTop: space.md,
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: space.lg,
    gap: space.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    padding: space.lg,
    paddingBottom: 120,
  },
  cell: {
    width: 108,
  },
  favoriteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: color.surface3,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: color.border,
  },
});
