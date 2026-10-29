import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { generateOutfits } from '../../lib/outfitGenerator';
import type { ClothingItem, OutfitSuggestion } from '../../lib/types';
import { createOutfit, getLastWornMap } from '../../repo/outfits';
import { listActiveItems } from '../../repo/items';
import { Button } from '../../ui/Button';
import { ColorDot } from '../../ui/ColorDot';
import { EmptyState } from '../../ui/EmptyState';
import { ItemThumbnail } from '../../ui/ItemThumbnail';
import { CheckIcon, ShuffleIcon, SunIcon } from '../../ui/icons';
import { GlassCard } from '../../ui/GlassCard';
import { color, space, type as textType } from '../../theme/tokens';

function dateSeedIndex(length: number, date = new Date()): number {
  if (length === 0) return 0;
  const seed = Number(`${date.getFullYear()}${date.getMonth()}${date.getDate()}`);
  return seed % length;
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [index, setIndex] = useState(0);
  const [logged, setLogged] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, lastWornAt]: [ClothingItem[], Map<string, string>] = await Promise.all([
        listActiveItems(),
        getLastWornMap(),
      ]);
      const generated = generateOutfits(items, { limit: 8, lastWornAt });
      setSuggestions(generated);
      setIndex(dateSeedIndex(generated.length));
      setLogged(false);
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
  if (suggestions.length === 0) {
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
});
