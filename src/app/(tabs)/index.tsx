import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { generateOutfits } from '../../lib/outfitGenerator';
import type { ClothingItem, Outfit, OutfitSuggestion } from '../../lib/types';
import { createOutfit, getLastWornMap, listFavoriteOutfits } from '../../repo/outfits';
import { listActiveItems, listItems } from '../../repo/items';
import { Button } from '../../ui/Button';
import { ColorDot } from '../../ui/ColorDot';
import { EmptyState } from '../../ui/EmptyState';
import { ItemThumbnail } from '../../ui/ItemThumbnail';
import { CheckIcon, ShuffleIcon, StarIcon, SunIcon } from '../../ui/icons';
import { GlassCard } from '../../ui/GlassCard';
import { color, radius, space, type as textType } from '../../theme/tokens';

function dateSeedIndex(length: number, date = new Date()): number {
  if (length === 0) return 0;
  const seed = Number(`${date.getFullYear()}${date.getMonth()}${date.getDate()}`);
  return seed % length;
}

interface SavedLook {
  outfit: Outfit;
  items: ClothingItem[];
}

/**
 * Favorited outfits, deduped by their exact item set (favoriting the same
 * combo on two different days shouldn't show two identical cards) and
 * limited to combos that are still fully wearable right now — every item
 * must still exist and not be in seasonal storage (see seasonal-archive.tsx).
 * Capped at 6 so the strip stays a quick-pick, not a second outfit list.
 */
function buildSavedLooks(favorites: Outfit[], items: ClothingItem[]): SavedLook[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const seenItemSets = new Set<string>();
  const looks: SavedLook[] = [];

  for (const outfit of favorites) {
    const resolvedItems = outfit.itemIds
      .map((id) => itemById.get(id))
      .filter((item): item is ClothingItem => item !== undefined);
    if (resolvedItems.length !== outfit.itemIds.length) continue;
    if (resolvedItems.some((item) => item.archived)) continue;

    const key = [...outfit.itemIds].sort().join('|');
    if (seenItemSets.has(key)) continue;
    seenItemSets.add(key);

    looks.push({ outfit, items: resolvedItems });
    if (looks.length >= 6) break;
  }

  return looks;
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [index, setIndex] = useState(0);
  const [logged, setLogged] = useState(false);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [wornLookId, setWornLookId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, lastWornAt, favorites, allItems] = await Promise.all([
        listActiveItems(),
        getLastWornMap(),
        listFavoriteOutfits(),
        listItems(),
      ]);
      const generated = generateOutfits(items, { limit: 8, lastWornAt });
      setSuggestions(generated);
      setIndex(dateSeedIndex(generated.length));
      setLogged(false);
      setSavedLooks(buildSavedLooks(favorites, allItems));
      setWornLookId(null);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Could not load your wardrobe.';
      Alert.alert('Something went wrong', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleWoreThis() {
    const current = suggestions[index];
    if (!current) return;
    try {
      await createOutfit({
        itemIds: current.items.map((item) => item.id),
        note: null,
        favorite: false,
        wornAt: new Date().toISOString(),
      });
      setLogged(true);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Could not save this outfit.';
      Alert.alert('Something went wrong', message);
    }
  }

  function handleShuffle() {
    if (suggestions.length <= 1) return;
    setIndex((current) => (current + 1) % suggestions.length);
    setLogged(false);
  }

  function handleWearLook(look: SavedLook) {
    Alert.alert(
      'Wear this look today?',
      `Logs this ${look.items.length}-piece saved look as today's outfit instead of the suggestion above.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wear it',
          onPress: () => {
            void (async () => {
              try {
                await createOutfit({
                  itemIds: look.items.map((item) => item.id),
                  note: null,
                  favorite: true,
                  wornAt: new Date().toISOString(),
                });
                setWornLookId(look.outfit.id);
              } catch (cause: unknown) {
                const message = cause instanceof Error ? cause.message : 'Could not log this look.';
                Alert.alert('Something went wrong', message);
              }
            })();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={color.text1} />
      </View>
    );
  }

  // `generateOutfits` itself already returns [] when there's nothing it can
  // build (no dress and no top+bottom pair) — see outfitGenerator.ts. Gating
  // on `wardrobeSize < 2` here as well wrongly blocked a real, valid, single-
  // dress wardrobe (wardrobeSize === 1): the generator happily produces a
  // one-item dress suggestion (that's the whole point of the "single piece"
  // colorScore case fixed earlier today), but this screen never let the user
  // see it, showing "Add at least one top and one bottom (or a dress)" even
  // though they already had exactly that dress.
  if (suggestions.length === 0 && savedLooks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        <EmptyState
          icon={<SunIcon size={40} color={color.text3} />}
          title="Not enough pieces yet"
          body="Add at least one top and one bottom (or a dress) to get your first outfit suggestion."
          actionAccessibilityLabel="Add an item"
          onAction={() => router.push('/item/new')}
        />
      </View>
    );
  }

  const suggestion = suggestions[index];

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
    >
      <Text style={[textType.label, { color: color.text3 }]}>TODAY&apos;S OUTFIT</Text>
      <Text style={[textType.display, { color: color.text1, marginTop: space.xxs }]}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {suggestion ? (
        <>
          <View style={styles.itemsRow}>
            {suggestion.items.map((item) => (
              <View key={item.id} style={styles.itemCell}>
                <ItemThumbnail item={item} size={88} />
                <Text style={[textType.caption, { color: color.text2, marginTop: space.xxs }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>

          <GlassCard style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <ColorDot hex={suggestion.items[0]?.colorHex ?? color.accent} size={10} />
              <Text style={[textType.label, { color: color.text2 }]}>WHY THIS WORKS</Text>
            </View>
            {suggestion.reasons.map((reason) => (
              <Text key={reason} style={[textType.body, { color: color.text1, marginTop: space.xs }]}>
                {reason}
              </Text>
            ))}
            <Text style={[textType.caption, { color: color.text3, marginTop: space.sm }]}>
              Match score {Math.round(suggestion.score * 100)}/100
            </Text>
          </GlassCard>

          <View style={styles.actions}>
            <Button
              variant="secondary"
              icon={(c) => <ShuffleIcon color={c} />}
              accessibilityLabel="Shuffle to another suggestion"
              onPress={handleShuffle}
              style={{ flex: 1 }}
            />
            <Button
              icon={(c) => <CheckIcon color={c} />}
              accessibilityLabel={logged ? 'Logged for today' : "I'm wearing this"}
              onPress={handleWoreThis}
              disabled={logged}
              style={{ flex: 2 }}
            />
          </View>
          {logged ? (
            <View style={styles.loggedRow}>
              <CheckIcon size={16} color={color.positive} />
              <Text style={[textType.caption, { color: color.positive }]}>Saved to your outfit history.</Text>
            </View>
          ) : null}
          {suggestions.length > 1 ? (
            <Text style={[textType.caption, { color: color.text3, marginTop: space.md, textAlign: 'center' }]}>
              {suggestions.length - 1} other suggestion{suggestions.length > 2 ? 's' : ''} from your closet
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[textType.caption, { color: color.text3, marginTop: space.lg }]}>
          Add at least one top and one bottom (or a dress) for a fresh daily suggestion — or wear one of your saved
          looks below.
        </Text>
      )}

      {savedLooks.length > 0 ? (
        <>
          <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>YOUR SAVED LOOKS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.looksRow}>
            {savedLooks.map((look) => {
              const wornToday = wornLookId === look.outfit.id;
              return (
                <Pressable
                  key={look.outfit.id}
                  accessibilityRole="button"
                  accessibilityLabel={wornToday ? 'Logged for today' : `Wear this ${look.items.length}-piece saved look today`}
                  style={styles.lookCard}
                  disabled={wornToday}
                  onPress={() => handleWearLook(look)}
                >
                  <View style={styles.lookThumbs}>
                    {look.items.slice(0, 3).map((item) => (
                      <ItemThumbnail key={item.id} item={item} size={48} />
                    ))}
                  </View>
                  <View style={styles.lookFooter}>
                    {wornToday ? (
                      <CheckIcon size={12} color={color.positive} />
                    ) : (
                      <StarIcon size={12} color={color.accent} filled />
                    )}
                    <Text style={[textType.caption, { color: wornToday ? color.positive : color.text2 }]} numberOfLines={1}>
                      {wornToday ? 'Worn today' : `${look.items.length} piece${look.items.length === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.xl,
  },
  itemCell: {
    width: 88,
  },
  reasonCard: {
    marginTop: space.xl,
    padding: space.lg,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xl,
  },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    marginTop: space.sm,
    justifyContent: 'center',
  },
  looksRow: {
    gap: space.sm,
    marginTop: space.sm,
  },
  lookCard: {
    width: 108,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.xs,
  },
  lookThumbs: {
    flexDirection: 'row',
    gap: 2,
  },
  lookFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: space.xxs,
  },
});
