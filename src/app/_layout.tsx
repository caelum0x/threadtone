import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useLocalDbBootstrap } from '../db/bootstrap';
import { color, space, type as textType } from '../theme/tokens';

export default function RootLayout() {
  const { ready, error } = useLocalDbBootstrap();

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

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator color={color.text1} />
        </View>
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
        <Stack.Screen name="outfit/build" options={{ presentation: 'modal' }} />
        <Stack.Screen name="outfit/[id]" />
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
