/**
 * First-run onboarding: 3 screens showing the real outcome, not a tutorial
 * of how the app works — per this account's App Store packaging rule
 * ("show the outcome, not how it works; never a tutorial"). Each step is a
 * real-screen mockup (src/ui/OnboardingMockup.tsx) built from the exact
 * primitives the live Wardrobe/Today screens use — a populated wardrobe
 * grid, a real outfit suggestion with its match score, the shuffle/log
 * actions and the saved look they produce — with one short caption, not an
 * abstract icon and a paragraph of feature explanation.
 *
 * Shown once; `RootLayout` only mounts this until `setOnboardingComplete()`
 * persists the flag to SQLite (see src/repo/appMeta.ts), then swaps to the
 * real tab navigator. Built from the same GlassCard/Button/icon primitives
 * as the rest of the app — no new design patterns, no emoji, icon-only
 * actions.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setOnboardingComplete } from '../repo/appMeta';
import { color, radius, space, type as textType } from '../theme/tokens';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { CheckIcon, ChevronRightIcon, CloseIcon } from './icons';
import { OnboardingMockup, type OnboardingStepId } from './OnboardingMockup';

interface Step {
  id: OnboardingStepId;
  caption: string;
}

const STEPS: Step[] = [
  { id: 'digitize', caption: 'Digitize your closet — nothing leaves this device.' },
  { id: 'suggest', caption: "Today's outfit, matched for you." },
  { id: 'act', caption: 'Shuffle, log it, or save the look.' },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  async function finish() {
    await setOnboardingComplete();
    onDone();
  }

  function handlePrimaryPress() {
    if (isLast) {
      void finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg },
      ]}
    >
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={() => void finish()}
          hitSlop={12}
        >
          <CloseIcon size={20} color={color.text3} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <GlassCard style={styles.card}>
          <OnboardingMockup step={current.id} />
        </GlassCard>
        <Text style={[textType.heading, { color: color.text1, marginTop: space.lg, textAlign: 'center' }]}>
          {current.caption}
        </Text>
      </View>

      <Button
        icon={(c) => (isLast ? <CheckIcon color={c} /> : <ChevronRightIcon color={c} />)}
        accessibilityLabel={isLast ? 'Get started' : 'Next'}
        onPress={handlePrimaryPress}
        style={{ alignSelf: 'center', width: 72 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: space.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: color.surface3,
  },
  dotActive: {
    backgroundColor: color.text1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: space.xl,
  },
});
