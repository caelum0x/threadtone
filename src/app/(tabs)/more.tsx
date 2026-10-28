/**
 * Fourth tab: a real hub for the screens that don't fit "today / wardrobe /
 * outfits" — Insights, Packing list, Seasonal archive, Shopping gaps, and
 * Settings. Keeps the icon-only 3-tab bar's simplicity while giving each of
 * these its own distinct, non-padding screen (see plans/threadtone.md's
 * "100-screens" audit for why each one is real, not filler).
 */
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, radius, space, type as textType } from '../../theme/tokens';
import {
  ArchiveIcon,
  ChartIcon,
  ChevronRightIcon,
  LightbulbIcon,
  SettingsIcon,
  SuitcaseIcon,
} from '../../ui/icons';

interface MenuRow {
  key: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  route: string;
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const rows: MenuRow[] = [
    {
      key: 'insights',
      icon: <ChartIcon size={20} color={color.text1} />,
      title: 'Insights',
      subtitle: 'Most/least worn, cost per wear, closet gaps',
      route: '/insights',
    },
    {
      key: 'packing',
      icon: <SuitcaseIcon size={20} color={color.text1} />,
      title: 'Packing list',
      subtitle: 'Build a capsule for an upcoming trip',
      route: '/packing-list',
    },
    {
      key: 'archive',
      icon: <ArchiveIcon size={20} color={color.text1} />,
      title: 'Seasonal archive',
      subtitle: 'Store off-season pieces without deleting them',
      route: '/seasonal-archive',
    },
    {
      key: 'shopping',
      icon: <LightbulbIcon size={20} color={color.text1} />,
      title: 'Shopping gaps',
      subtitle: 'What would actually improve your closet',
      route: '/shopping-gaps',
    },
    {
      key: 'settings',
      icon: <SettingsIcon size={20} color={color.text1} />,
      title: 'Settings',
      subtitle: 'Currency, data, onboarding',
      route: '/settings',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={textType.title}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row) => (
          <Pressable key={row.key} style={styles.row} onPress={() => router.push(row.route)}>
            {row.icon}
            <View style={{ flex: 1, marginLeft: space.sm }}>
              <Text style={[textType.bodyMedium, { color: color.text1 }]}>{row.title}</Text>
              <Text style={[textType.caption, { color: color.text3, marginTop: 2 }]}>{row.subtitle}</Text>
            </View>
            <ChevronRightIcon size={18} color={color.text3} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  content: {
    padding: space.lg,
    gap: space.sm,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.md,
  },
});
