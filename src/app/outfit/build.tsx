import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scoreOutfit } from '../../lib/outfitGenerator';
import type { ClothingCategory, ClothingItem } from '../../lib/types';
import { CLOTHING_CATEGORIES } from '../../lib/types';
import { listItems } from '../../repo/items';
import { createOutfit } from '../../repo/outfits';
import { color, radius, space, type as textType } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';
import { CheckIcon, ChevronLeftIcon } from '../../ui/icons';
import { ItemThumbnail } from '../../ui/ItemThumbnail';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessory',
};

export default function BuildOutfitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      setItems(await listItems());
      setLoading(false);
    })();
  }, []);

  const byCategory = useMemo(() => {
    const groups = new Map<ClothingCategory, ClothingItem[]>();
    for (const category of CLOTHING_CATEGORIES) groups.set(category, []);
    for (const item of items) groups.get(item.category)?.push(item);
    return groups;
  }, [items]);

  const selectedItems = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds]);
  const suggestion = useMemo(() => (selectedItems.length >= 2 ? scoreOutfit(selectedItems) : null), [selectedItems]);

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (selectedItems.length === 0) {
      Alert.alert('Pick at least one item', 'Tap pieces below to add them to this outfit.');
      return;
    }
    setSaving(true);
    try {
      await createOutfit({
        itemIds: [...selectedIds],
        note: null,
        favorite: false,
        wornAt: null,
      });
      router.back();
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Could not save this outfit.';
      Alert.alert('Something went wrong', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
        <Text style={textType.heading}>Build an outfit</Text>
        <Text style={[textType.caption, { color: color.text3, width: 24, textAlign: 'center' }]}>
          {selectedItems.length > 0 ? selectedItems.length : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {CLOTHING_CATEGORIES.map((category) => {
          const categoryItems = byCategory.get(category) ?? [];
          if (categoryItems.length === 0) return null;
          return (
            <View key={category} style={{ marginTop: space.lg }}>
              <Text style={[textType.label, { color: color.text3 }]}>{CATEGORY_LABEL[category].toUpperCase()}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {categoryItems.map((item) => (
                  <Pressable key={item.id} onPress={() => toggle(item.id)} style={styles.cell}>
                    <View style={[styles.thumbWrap, selectedIds.has(item.id) && styles.thumbWrapSelected]}>
                      <ItemThumbnail item={item} size={76} />
                    </View>
                    <Text style={[textType.caption, { color: color.text2, marginTop: 2 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          );
        })}

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

        <Button
          icon={(c) => <CheckIcon color={c} />}
          accessibilityLabel="Save outfit"
          onPress={handleSave}
          loading={saving}
          disabled={selectedItems.length === 0}
          style={{ marginTop: space.xl }}
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
  row: {
    gap: space.sm,
    marginTop: space.xs,
  },
  cell: {
    width: 76,
  },
  thumbWrap: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapSelected: {
    borderColor: color.accent,
  },
  scoreCard: {
    marginTop: space.xl,
    padding: space.lg,
  },
});
