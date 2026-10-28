/**
 * First-run onboarding: 3 screens explaining the core loop (digitize your
 * closet -> get a daily outfit suggestion -> shuffle or log what you
 * actually wore). Shown once; `RootLayout` only mounts this until
 * `setOnboardingComplete()` persists the flag to SQLite (see
 * src/repo/appMeta.ts), then swaps to the real tab navigator. Built from
 * the same GlassCard/Button/icon primitives as the rest of the app — no new
 * design patterns, no emoji, icon-only actions.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setOnboardingComplete } from '../repo/appMeta';
import { color, radius, space, type as textType } from '../theme/tokens';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { CheckIcon, ChevronRightIcon, CloseIcon, HangerIcon, LayersIcon, SunIcon } from './icons';

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: <HangerIcon size={40} color={color.text1} />,
    title: 'Digitize your closet',
    body:
      'Photograph or pick a photo of each piece you own. Tag its category, color, pattern and formality — your wardrobe lives on this device, never in the cloud.',
  },
  {
    icon: <SunIcon size={40} color={color.text1} />,
    title: "Get today's outfit",
    body:
      'Every day, get a complete outfit ranked by real color-wheel harmony, formality and how recently each piece was worn — with a plain-language reason why.',
  },
  {
    icon: <LayersIcon size={40} color={color.text1} />,
    title: 'Shuffle, build, or log it',
    body:
      "Don't love the pick? Shuffle for the next-best option, build your own outfit with a live match score, or log what you actually wore in one tap.",
  },
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
          {current.icon}
          <Text style={[textType.title, { color: color.text1, marginTop: space.lg, textAlign: 'center' }]}>
            {current.title}
          </Text>
          <Text style={[textType.body, { color: color.text2, marginTop: space.sm, textAlign: 'center' }]}>
            {current.body}
          </Text>
        </GlassCard>
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
