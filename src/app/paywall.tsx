/**
 * Wearday Plus — the app's one paywall screen, per this account's App Store
 * packaging rule ("put the paywall right after the value moment and show it
 * to all of them, not just the fraction who tap a gated feature later").
 * Shown automatically, once, right after a brand-new user's first real
 * outfit suggestion renders on the Today tab (see (tabs)/index.tsx — that's
 * the actual "aha" moment this app has, not onboarding completion, since a
 * fresh wardrobe has nothing to suggest yet). Also reachable on-demand from
 * every gated screen (Insights, Shopping gaps, backup export) and from the
 * More tab. Always dismissable, never blocks free use of the core loop.
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getPlusPackages,
  isPurchaseCancelled,
  isRevenueCatAvailable,
  type PlusPackage,
  purchasePlusPackage,
  restorePurchases,
} from '../billing/revenueCatService';
import { usePremiumStatus } from '../billing/usePremiumStatus';
import { color, radius, space, type as textType } from '../theme/tokens';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { CheckIcon, CloseIcon, CrownIcon, RefreshIcon } from '../ui/icons';

type Feature = 'today' | 'insights' | 'shoppingGaps' | 'export' | 'generic';

const FEATURE_COPY: Record<Feature, { title: string; subtitle: string }> = {
  today: {
    title: 'Go deeper on your closet',
    subtitle: "You've got your first outfit. Wearday Plus unlocks the rest of the analysis.",
  },
  insights: { title: 'Insights is Wearday Plus', subtitle: 'Wear history, cost-per-wear, and closet gaps.' },
  shoppingGaps: { title: 'Shopping gaps is Wearday Plus', subtitle: 'What would actually improve your closet.' },
  export: { title: 'Backup export is Wearday Plus', subtitle: 'Take your full wardrobe data with you, any time.' },
  generic: { title: 'Wearday Plus', subtitle: 'Unlock deeper closet analysis.' },
};

const PERKS = [
  'Wear-history Insights — most/least worn, cost-per-wear',
  'Shopping-gaps advisor — the hardest pieces to match',
  'Full backup export, any time',
];

function isValidFeature(value: string | undefined): value is Feature {
  return value === 'today' || value === 'insights' || value === 'shoppingGaps' || value === 'export' || value === 'generic';
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const copy = FEATURE_COPY[isValidFeature(feature) ? feature : 'generic'];

  const { isPremium, refresh } = usePremiumStatus();
  const available = isRevenueCatAvailable();
  const [packages, setPackages] = useState<PlusPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(available);
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!available) return;
    getPlusPackages()
      .then(setPackages)
      .finally(() => setLoadingPackages(false));
  }, [available]);

  // Already Plus (e.g. this is the one-time automatic prompt firing on a
  // device that restored a purchase elsewhere) — dismiss immediately rather
  // than show a sell screen for something the user already has.
  useFocusEffect(
    useCallback(() => {
      if (isPremium) router.back();
    }, [isPremium, router]),
  );

  async function handlePurchase(plusPackage: PlusPackage): Promise<void> {
    setError(null);
    setBusy('purchase');
    try {
      await purchasePlusPackage(plusPackage);
      await refresh();
      router.back();
    } catch (cause: unknown) {
      if (!isPurchaseCancelled(cause)) {
        setError("Couldn't complete the purchase. Please try again in a moment.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore(): Promise<void> {
    setError(null);
    setBusy('restore');
    try {
      const restored = await restorePurchases();
      await refresh();
      if (!restored.isPremium) {
        setError('No previous Wearday Plus purchase was found for this device.');
      } else {
        router.back();
      }
    } catch {
      setError("Couldn't restore purchases right now. Please try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={12}>
          <CloseIcon size={20} color={color.text3} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.heroCard}>
          <CrownIcon color={color.accent} size={32} />
          <Text style={[textType.title, { color: color.text1, marginTop: space.sm, textAlign: 'center' }]}>
            {copy.title}
          </Text>
          <Text style={[textType.body, { color: color.text2, marginTop: space.xs, textAlign: 'center' }]}>
            {copy.subtitle}
          </Text>
          <View style={styles.perks}>
            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <CheckIcon size={16} color={color.positive} />
                <Text style={[textType.body, { color: color.text1, flex: 1, marginLeft: space.xs }]}>{perk}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {error ? (
          <Text style={[textType.caption, { color: color.negative, marginTop: space.md, textAlign: 'center' }]}>
            {error}
          </Text>
        ) : null}

        {!available ? (
          <GlassCard style={styles.noticeCard}>
            <Text style={[textType.caption, { color: color.text2 }]}>
              Subscriptions aren&apos;t available on this build yet. Please update the app and try again.
            </Text>
          </GlassCard>
        ) : loadingPackages ? (
          <Text style={[textType.caption, { color: color.text2, marginTop: space.lg, textAlign: 'center' }]}>
            Loading plans…
          </Text>
        ) : packages.length === 0 ? (
          <GlassCard style={styles.noticeCard}>
            <Text style={[textType.caption, { color: color.text2 }]}>
              Plans aren&apos;t ready yet. Please check back shortly.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.packages}>
            {packages.map((pkg) => (
              <Pressable
                key={pkg.identifier}
                accessibilityRole="button"
                accessibilityLabel={`${pkg.billingPeriod === 'yearly' ? 'Yearly' : pkg.billingPeriod === 'monthly' ? 'Monthly' : 'Plus'} plan, ${pkg.priceString}`}
                onPress={() => void handlePurchase(pkg)}
                disabled={busy !== null}
                style={[styles.packageRow, busy !== null && styles.packageRowDisabled]}
              >
                <Text style={[textType.bodyMedium, { color: color.text1 }]}>
                  {pkg.billingPeriod === 'yearly' ? 'Yearly' : pkg.billingPeriod === 'monthly' ? 'Monthly' : 'Plus'}
                </Text>
                <Text style={[textType.bodyMedium, { color: color.text1 }]}>{pkg.priceString}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          icon={(c) => <RefreshIcon color={c} />}
          accessibilityLabel="Restore purchases"
          onPress={() => void handleRestore()}
          loading={busy === 'restore'}
          disabled={busy !== null || !available}
          style={{ flex: 1 }}
        />
        <Button
          variant="secondary"
          icon={(c) => <CloseIcon color={c} />}
          accessibilityLabel="Not now"
          onPress={() => router.back()}
          style={{ flex: 1 }}
        />
      </View>
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
  content: {
    paddingBottom: space.lg,
  },
  heroCard: {
    marginTop: space.md,
    padding: space.xl,
    alignItems: 'center',
  },
  perks: {
    width: '100%',
    marginTop: space.lg,
    gap: space.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeCard: {
    marginTop: space.lg,
    padding: space.md,
  },
  packages: {
    marginTop: space.lg,
    gap: space.sm,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.md,
  },
  packageRowDisabled: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
});
