import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { color } from '../../theme/tokens';
import { GridIcon, LayersIcon, SunIcon } from '../../ui/icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        tabBarBackground: () => <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />,
        tabBarActiveTintColor: color.text1,
        tabBarInactiveTintColor: color.text3,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: ({ color: c }) => <SunIcon color={String(c)} /> }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{ title: 'Wardrobe', tabBarIcon: ({ color: c }) => <GridIcon color={String(c)} /> }}
      />
      <Tabs.Screen
        name="outfits"
        options={{ title: 'Outfits', tabBarIcon: ({ color: c }) => <LayersIcon color={String(c)} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    backgroundColor: 'transparent',
  },
});
