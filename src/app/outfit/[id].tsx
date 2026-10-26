import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scoreOutfit } from '../../lib/outfitGenerator';
import type { ClothingItem, Outfit } from '../../lib/types';
import { listItems } from '../../repo/items';
import { deleteOutfit, getOutfit, markOutfitWorn, toggleOutfitFavorite } from '../../repo/outfits';
import { color, space, type as textType } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';
import { CheckIcon, ChevronLeftIcon, StarIcon, TrashIcon } from '../../ui/icons';
import { ItemThumbnail } from '../../ui/ItemThumbnail';

export default function OutfitDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [found, allItems] = await Promise.all([getOutfit(id), listItems()]);
    setOutfit(found);
    setItems(allItems);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const outfitItems = useMemo(() => {
    if (!outfit) return [];
    const byId = new Map(items.map((item) => [item.id, item]));
    return outfit.itemIds.map((itemId) => byId.get(itemId)).filter((item): item is ClothingItem => item !== undefined);
  }, [outfit, items]);

  const suggestion = useMemo(() => (outfitItems.length >= 2 ? scoreOutfit(outfitItems) : null), [outfitItems]);

  async function handleToggleFavorite() {
    if (!outfit) return;
    const next = !outfit.favorite;
    setOutfit({ ...outfit, favorite: next });
    await toggleOutfitFavorite(outfit.id, next);
  }

  async function handleMarkWorn() {
    if (!outfit) return;
    const wornAt = new Date().toISOString();
    setOutfit({ ...outfit, wornAt });
    await markOutfitWorn(outfit.id, wornAt);
  }

  function handleDelete() {
    if (!outfit) return;
    Alert.alert('Delete this outfit?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteOutfit(outfit.id);
            router.back();
          })();
        },
      },
    ]);
  }

  if (loading || !outfit) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={color.text1} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Outfit</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={outfit.favorite ? "Remove from favorites" : "Add to favorites"} onPress={handleToggleFavorite} hitSlop={12}>
          <StarIcon color={color.accent} filled={outfit.favorite} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.itemsRow}>
          {outfitItems.map((item) => (
            <View key={item.id} style={styles.itemCell}>
              <ItemThumbnail item={item} size={92} />
              <Text style={[textType.caption, { color: color.text2, marginTop: space.xxs }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))}
          {outfitItems.length < outfit.itemIds.length ? (
            <Text style={[textType.caption, { color: color.text3 }]}>
              {outfit.itemIds.length - outfitItems.length} item(s) in this outfit were deleted from your wardrobe.
            </Text>
          ) : null}
        </View>

        {suggestion ? (
          <GlassCard style={styles.scoreCard}>
            <Text style={[textType.label, { color: color.text2 }]}>MATCH SCORE</Text>
            <Text style={[textType.display, { color: color.text1, marginTop: space.xxs }]}>
              {Math.round(suggestion.score * 100)}/100
            </Text>
            {suggestion.reasons.map((reason) => (
              <Text key={reason} style={[textType.caption, { color: color.text2, marginTop: space.xxs }]}>
                {reason}
              </Text>
            ))}
          </GlassCard>
        ) : null}

        <Text style={[textType.caption, { color: color.text3, marginTop: space.lg }]}>
          {outfit.wornAt
            ? `Worn on ${new Date(outfit.wornAt).toLocaleDateString()}`
            : `Built on ${new Date(outfit.createdAt).toLocaleDateString()}`}
        </Text>

        {!outfit.wornAt ? (
          <Button
            icon={(c) => <CheckIcon color={c} />}
            accessibilityLabel="Mark as worn today"
            onPress={handleMarkWorn}
            style={{ marginTop: space.lg }}
          />
        ) : null}
        <Button
          icon={(c) => <TrashIcon color={c} />}
          accessibilityLabel="Delete outfit"
          variant="danger"
          onPress={handleDelete}
          style={{ marginTop: space.sm }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
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
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  itemCell: {
    width: 92,
  },
  scoreCard: {
    marginTop: space.xl,
    padding: space.lg,
  },
});
