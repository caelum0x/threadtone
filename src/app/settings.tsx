/**
 * Settings/preferences — the real gap flagged in plans/threadtone.md: there
 * was no way to change the currency symbol used for cost-per-wear, clear
 * wardrobe data, or replay the first-run intro without reinstalling the
 * app. Everything here reads/writes the same on-device SQLite file as the
 * rest of the app; nothing calls out to a network.
 */
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteItemPhoto } from '../lib/photoStorage';
import { getCurrencySymbol, setCurrencySymbol } from '../repo/appMeta';
import { deleteAllItems, listItems } from '../repo/items';
import { deleteAllOutfits, listOutfits } from '../repo/outfits';
import { color, radius, space, type as textType } from '../theme/tokens';
import { Chip } from '../ui/Chip';
import { GlassCard } from '../ui/GlassCard';
import { ChevronLeftIcon, ChevronRightIcon, HangerIcon, LayersIcon, TrashIcon } from '../ui/icons';

const CURRENCY_OPTIONS = ['$', '€', '£', '₺'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [currency, setCurrency] = useState('$');
  const [itemCount, setItemCount] = useState(0);
  const [outfitCount, setOutfitCount] = useState(0);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    const [symbol, items, outfits] = await Promise.all([getCurrencySymbol(), listItems(), listOutfits()]);
    setCurrency(symbol);
    setItemCount(items.length);
    setOutfitCount(outfits.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleSelectCurrency(symbol: string) {
    setCurrency(symbol);
    await setCurrencySymbol(symbol);
  }

  function handleClearData() {
    Alert.alert(
      'Clear all wardrobe data?',
      'Deletes every item, outfit, and saved photo from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setClearing(true);
              try {
                const items = await listItems();
                for (const item of items) deleteItemPhoto(item.photoUri);
                await deleteAllOutfits();
                await deleteAllItems();
                await load();
                Alert.alert('Done', 'Your wardrobe data has been cleared.');
              } finally {
                setClearing(false);
              }
            })();
          },
        },
      ],
    );
  }

  const version: string = typeof Constants.expoConfig?.version === 'string' ? Constants.expoConfig.version : '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[textType.label, { color: color.text3 }]}>CURRENCY</Text>
        <Text style={[textType.caption, { color: color.text3, marginTop: space.xxs }]}>
          Used for cost-per-wear in Insights.
        </Text>
        <View style={styles.chipRow}>
          {CURRENCY_OPTIONS.map((symbol) => (
            <Chip key={symbol} label={symbol} selected={currency === symbol} onPress={() => void handleSelectCurrency(symbol)} />
          ))}
        </View>

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>ONBOARDING</Text>
        <Pressable style={styles.row} onPress={() => router.push('/onboarding')}>
          <HangerIcon size={18} color={color.text2} />
          <Text style={[textType.body, { color: color.text1, flex: 1, marginLeft: space.xs }]}>Replay intro</Text>
          <ChevronRightIcon size={18} color={color.text3} />
        </Pressable>

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>DATA</Text>
        <Pressable style={[styles.row, styles.dangerRow]} onPress={handleClearData} disabled={clearing}>
          <TrashIcon size={18} color={color.negative} />
          <Text style={[textType.body, { color: color.negative, flex: 1, marginLeft: space.xs }]}>
            {clearing ? 'Clearing…' : 'Clear wardrobe data'}
          </Text>
        </Pressable>

        <GlassCard style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <LayersIcon size={16} color={color.text3} />
            <Text style={[textType.caption, { color: color.text2, marginLeft: space.xs }]}>
              {itemCount} item{itemCount === 1 ? '' : 's'} · {outfitCount} outfit{outfitCount === 1 ? '' : 's'} logged
            </Text>
          </View>
          <Text style={[textType.caption, { color: color.text3, marginTop: space.sm }]}>
            Wearday {version} — no account, no cloud. Everything stays on this device.
          </Text>
        </GlassCard>
      </ScrollView>
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
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  row: {
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
  dangerRow: {
    borderColor: color.negative,
  },
  aboutCard: {
    marginTop: space.xl,
    padding: space.lg,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
