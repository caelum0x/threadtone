/**
 * Real-screen mockups for onboarding (src/ui/OnboardingScreen.tsx). Per this
 * account's App Store packaging rule — onboarding must show the outcome,
 * never a tutorial of generic icons explaining how the app works — each
 * step below is a small, static stand-in for the actual screen a new user
 * will land on, built from the exact same primitives (GlassCard, ColorDot,
 * ItemThumbnail, Button, the same text styles) the real Wardrobe and Today
 * screens use. The data is fixed sample data (no DB access — onboarding
 * runs before a user has added anything), but the layout and copy mirror
 * (tabs)/wardrobe.tsx and (tabs)/index.tsx pixel-for-pixel, the same story
 * arc used in the App Store screenshots this account's packaging rule
 * requires: a real outfit suggestion with its match score, not an abstract
 * icon.
 */
import { StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type as textType } from '../theme/tokens';
import { Button } from './Button';
import { ColorDot } from './ColorDot';
import { GlassCard } from './GlassCard';
import { CheckIcon, ShuffleIcon, StarIcon } from './icons';
import { ItemThumbnail } from './ItemThumbnail';

export type OnboardingStepId = 'digitize' | 'suggest' | 'act';

interface SampleItem {
  name: string;
  colorHex: string;
  photoUri: null;
}

const WARDROBE_SAMPLE: SampleItem[] = [
  { name: 'White tee', colorHex: '#F2F1ED', photoUri: null },
  { name: 'Navy jeans', colorHex: '#28344A', photoUri: null },
  { name: 'Tan jacket', colorHex: '#C7A06E', photoUri: null },
  { name: 'White sneakers', colorHex: '#ECECEA', photoUri: null },
  { name: 'Olive shirt', colorHex: '#6B7353', photoUri: null },
  { name: 'Black belt', colorHex: '#1C1C1E', photoUri: null },
];

const OUTFIT_SAMPLE: SampleItem[] = [
  { name: 'Olive shirt', colorHex: '#6B7353', photoUri: null },
  { name: 'Tan chinos', colorHex: '#C7A06E', photoUri: null },
  { name: 'White sneakers', colorHex: '#ECECEA', photoUri: null },
];

const LOOK_SAMPLE: SampleItem[] = [
  { name: 'White tee', colorHex: '#F2F1ED', photoUri: null },
  { name: 'Navy jeans', colorHex: '#28344A', photoUri: null },
];

/** Step 1: a glimpse of the real Wardrobe grid, already populated. */
function DigitizeMockup() {
  return (
    <View style={styles.grid}>
      {WARDROBE_SAMPLE.map((item) => (
        <View key={item.name} style={styles.gridCell}>
          <ItemThumbnail item={item} size={64} />
          <Text style={[textType.caption, { color: color.text2, marginTop: space.xxs }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Step 2: the actual Today-screen suggestion card — items, reason, and the real match score. */
function SuggestMockup() {
  return (
    <>
      <View style={styles.outfitRow}>
        {OUTFIT_SAMPLE.map((item) => (
          <View key={item.name} style={styles.outfitCell}>
            <ItemThumbnail item={item} size={64} />
          </View>
        ))}
      </View>
      <GlassCard style={styles.reasonCard}>
        <View style={styles.reasonHeader}>
          <ColorDot hex={OUTFIT_SAMPLE[0].colorHex} size={10} />
          <Text style={[textType.label, { color: color.text2 }]}>WHY THIS WORKS</Text>
        </View>
        <Text style={[textType.body, { color: color.text1, marginTop: space.xs }]}>
          Olive and tan sit next to each other on the color wheel for an easy, cohesive palette.
        </Text>
        <Text style={[textType.caption, { color: color.text3, marginTop: space.sm }]}>Match score 92/100</Text>
      </GlassCard>
    </>
  );
}

/** Step 3: the real shuffle/log actions, plus the outcome — a saved look ready to wear again. */
function ActMockup() {
  return (
    <>
      <View style={styles.actionsRow}>
        <Button
          variant="secondary"
          icon={(c) => <ShuffleIcon color={c} />}
          accessibilityLabel="Shuffle"
          onPress={() => {}}
          style={{ flex: 1 }}
        />
        <Button icon={(c) => <CheckIcon color={c} />} accessibilityLabel="Log it" onPress={() => {}} style={{ flex: 2 }} />
      </View>
      <View style={styles.lookCard}>
        <View style={styles.lookThumbs}>
          {LOOK_SAMPLE.map((item) => (
            <ItemThumbnail key={item.name} item={item} size={44} />
          ))}
        </View>
        <View style={styles.lookFooter}>
          <StarIcon size={12} color={color.accent} filled />
          <Text style={[textType.caption, { color: color.text2 }]}>Saved look · 2 pieces</Text>
        </View>
      </View>
    </>
  );
}

export function OnboardingMockup({ step }: { step: OnboardingStepId }) {
  if (step === 'digitize') return <DigitizeMockup />;
  if (step === 'suggest') return <SuggestMockup />;
  return <ActMockup />;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'center',
  },
  gridCell: {
    width: 64,
    alignItems: 'center',
  },
  outfitRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  outfitCell: {
    width: 64,
  },
  reasonCard: {
    marginTop: space.lg,
    padding: space.md,
    width: '100%',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
  },
  lookCard: {
    marginTop: space.lg,
    width: 116,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.xs,
    alignSelf: 'center',
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
