import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { color, radius } from '../theme/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/** The default surface treatment per this account's design rules: translucent white/black glass, no color tints. */
export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
});
