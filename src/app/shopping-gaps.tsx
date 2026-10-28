/**
 * "What would improve your wardrobe most" — real analysis, not a generic
 * shopping tip list. Uses the same color-harmony math and outfit generator
 * already powering Today's suggestion (see src/lib/shoppingGaps.ts) against
 * the active (non-archived) wardrobe.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countPossibleOutfits, findClosetGaps, findHardToMatchItems } from '../lib/shoppingGaps';
import type { ClothingCategory, ClothingItem } from '../lib/types';
import { listActiveItems } from '../repo/items';
import { color, radius, space, type as textType } from '../theme/tokens';
import { EmptyState } from '../ui/EmptyState';
import { ChevronLeftIcon, LightbulbIcon } from '../ui/icons';
import { ItemThumbnail } from '../ui/ItemThumbnail';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'tops',
  bottom: 'bottoms',
  dress: 'dresses',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessory: 'accessories',
};

export default function ShoppingGapsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setWardrobe(await listActiveItems());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const gaps = useMemo(() => findClosetGaps(wardrobe).filter((g) => g.severity !== 'fine'), [wardrobe]);
  const hardToMatch = useMemo(() => findHardToMatchItems(wardrobe, 3), [wardrobe]);
  const outfitCount = useMemo(() => countPossibleOutfits(wardrobe), [wardrobe]);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Shopping gaps</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      ) : wardrobe.length < 2 ? (
        <EmptyState
          icon={<LightbulbIcon size={40} color={color.text3} />}
          title="Add a few more pieces"
          body="This advisor needs at least a couple of active items to find real gaps in your closet."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[textType.body, { color: color.text1 }]}>
            You can currently build {outfitCount}
            {outfitCount >= 500 ? '+' : ''} outfit{outfitCount === 1 ? '' : 's'} from your closet.
          </Text>

          {gaps.length > 0 ? (
            <>
              <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>CLOSET GAPS</Text>
              {gaps.map((gap) => (
                <View key={gap.category} style={styles.card}>
                  <Text style={[textType.body, { color: color.text1 }]}>
                    {gap.count === 0
                      ? `You have no ${CATEGORY_LABEL[gap.category]} yet.`
                      : `Only 1 pair/piece of ${CATEGORY_LABEL[gap.category]} — most outfits will repeat it.`}
                  </Text>
                  <Text style={[textType.caption, { color: color.text3, marginTop: space.xxs }]}>
                    Adding one more would meaningfully increase how many distinct outfits you can build.
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={[textType.caption, { color: color.text3, marginTop: space.xl }]}>
              No category gaps found — every category has at least 2 pieces.
            </Text>
          )}

          {hardToMatch.length > 0 ? (
            <>
              <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>HARDEST PIECES TO MATCH</Text>
              <Text style={[textType.caption, { color: color.text3, marginTop: space.xxs }]}>
                These clash with most of what you own. A neutral replacement would open up more combinations.
              </Text>
              {hardToMatch.map(({ item, avgHarmony }) => (
                <View key={item.id} style={styles.listRow}>
                  <ItemThumbnail item={item} size={44} />
                  <View style={{ flex: 1, marginLeft: space.sm }}>
                    <Text style={[textType.body, { color: color.text1 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[textType.caption, { color: color.text3 }]}>{item.colorName}</Text>
                  </View>
                  <Text style={[textType.caption, { color: color.text3 }]}>{Math.round(avgHarmony * 100)}% match</Text>
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
  card: {
    marginTop: space.sm,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.md,
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
