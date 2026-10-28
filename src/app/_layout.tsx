import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useLocalDbBootstrap } from '../db/bootstrap';
import { isOnboardingComplete } from '../repo/appMeta';
import { color, space, type as textType } from '../theme/tokens';
import { OnboardingScreen } from '../ui/OnboardingScreen';

export default function RootLayout() {
  const { ready, error } = useLocalDbBootstrap();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const complete = await isOnboardingComplete();
      if (!cancelled) setOnboardingComplete(complete);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <Text style={[textType.heading, { color: color.negative }]}>Couldn&apos;t open your wardrobe</Text>
          <Text style={[textType.body, { color: color.text2, marginTop: space.xs, textAlign: 'center' }]}>{error}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!ready || onboardingComplete === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!onboardingComplete) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onDone={() => setOnboardingComplete(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="item/history/[id]" />
        <Stack.Screen name="outfit/build" options={{ presentation: 'modal' }} />
        <Stack.Screen name="outfit/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="packing-list" />
        <Stack.Screen name="seasonal-archive" />
        <Stack.Screen name="shopping-gaps" />
        <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
    paddingHorizontal: space.xl,
  },
});
