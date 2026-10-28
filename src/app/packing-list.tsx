/**
 * Trip packing builder: pick a trip length + occasion, get a day-by-day
 * outfit plan and the flattened unique-piece packing list — real reuse of
 * the existing outfit generator's freshness scoring (see
 * src/lib/packingPlanner.ts) rather than new randomization.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildPackingPlan, filterWardrobeByOccasion, summarizePackingList, type PackingDay, type PackingOccasion } from '../lib/packingPlanner';
import type { ClothingItem } from '../lib/types';
import { listActiveItems } from '../repo/items';
import { createOutfit } from '../repo/outfits';
import { color, radius, space, type as textType } from '../theme/tokens';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, PlusIcon, SuitcaseIcon } from '../ui/icons';
import { ItemThumbnail } from '../ui/ItemThumbnail';

const OCCASIONS: { label: string; value: PackingOccasion }[] = [
  { label: 'Any', value: 'any' },
  { label: 'Casual', value: 'casual' },
  { label: 'Smart-casual', value: 'smart-casual' },
  { label: 'Formal', value: 'formal' },
];

export default function PackingListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [days, setDays] = useState(3);
  const [occasion, setOccasion] = useState<PackingOccasion>('any');
  const [plan, setPlan] = useState<PackingDay[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      setWardrobe(await listActiveItems());
      setLoading(false);
    })();
  }, []);

  const packedItems = useMemo(() => (plan ? summarizePackingList(plan) : []), [plan]);

  function handleGenerate() {
    const filtered = filterWardrobeByOccasion(wardrobe, occasion);
    const generated = buildPackingPlan(filtered, days);
    if (generated.length === 0) {
      Alert.alert('Not enough pieces', 'Add more items for this occasion, or try "Any" to use your full wardrobe.');
      return;
    }
    if (generated.length < days) {
      Alert.alert(
        'Shorter plan than requested',
        `Your wardrobe could only build ${generated.length} of ${days} days for this occasion.`,
      );
    }
    setPlan(generated);
  }

  async function handleSaveAll() {
    if (!plan) return;
    setSaving(true);
    try {
      for (const day of plan) {
        await createOutfit({
          itemIds: day.suggestion.items.map((i) => i.id),
          note: `Trip day ${day.day}`,
          favorite: false,
          wornAt: null,
        });
      }
      Alert.alert('Saved', `Added ${plan.length} planned outfit${plan.length === 1 ? '' : 's'} to your Outfits tab.`);
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
        <Text style={textType.heading}>Packing list</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[textType.label, { color: color.text3 }]}>TRIP LENGTH</Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fewer days"
            style={styles.stepperButton}
            onPress={() => setDays((d) => Math.max(1, d - 1))}
          >
            <Text style={[textType.heading, { color: color.text1 }]}>−</Text>
          </Pressable>
          <Text style={[textType.title, { color: color.text1, width: 96, textAlign: 'center' }]}>
            {days} day{days === 1 ? '' : 's'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More days"
            style={styles.stepperButton}
            onPress={() => setDays((d) => Math.min(14, d + 1))}
          >
            <Text style={[textType.heading, { color: color.text1 }]}>+</Text>
          </Pressable>
        </View>

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>OCCASION</Text>
        <View style={styles.chipRow}>
          {OCCASIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setOccasion(option.value)}
              style={[styles.occasionChip, occasion === option.value && styles.occasionChipSelected]}
            >
              <Text style={[textType.caption, { color: occasion === option.value ? color.accentFg : color.text2 }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          icon={(c) => <SuitcaseIcon color={c} />}
          accessibilityLabel="Generate packing plan"
          onPress={handleGenerate}
          style={{ marginTop: space.xl }}
        />

        {plan ? (
          <>
            <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>DAY BY DAY</Text>
            {plan.map((day) => (
              <View key={day.day} style={styles.dayCard}>
                <Text style={[textType.bodyMedium, { color: color.text1 }]}>
                  Day {day.day} · {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.itemsRow}>
                  {day.suggestion.items.map((item) => (
                    <ItemThumbnail key={item.id} item={item} size={56} />
                  ))}
                </View>
              </View>
            ))}

            <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>PACK THESE ITEMS</Text>
            {packedItems.map(({ item, daysWorn }) => (
              <View key={item.id} style={styles.packRow}>
                <ItemThumbnail item={item} size={40} />
                <Text style={[textType.body, { color: color.text1, flex: 1, marginLeft: space.sm }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[textType.caption, { color: color.text3 }]}>
                  {daysWorn} of {plan.length} day{plan.length === 1 ? '' : 's'}
                </Text>
              </View>
            ))}

            <Button
              icon={(c) => <PlusIcon color={c} />}
              accessibilityLabel="Add this plan to Outfits"
              onPress={() => void handleSaveAll()}
              loading={saving}
              variant="secondary"
              style={{ marginTop: space.xl }}
            />
          </>
        ) : null}
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    marginTop: space.sm,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  occasionChip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  occasionChipSelected: {
    backgroundColor: color.accent,
    borderColor: color.accent,
  },
  dayCard: {
    marginTop: space.sm,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.sm,
  },
  itemsRow: {
    flexDirection: 'row',
    gap: space.xs,
    marginTop: space.xs,
  },
  packRow: {
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
