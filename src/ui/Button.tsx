import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { color, radius, TAP_TARGET } from '../theme/tokens';

interface ButtonProps {
  /** Renders the icon for the current foreground color — never visible text. */
  icon: (iconColor: string) => React.ReactNode;
  /** Screen-reader-only label; never rendered on screen (Instagram-clean: icon-only buttons). */
  accessibilityLabel: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ icon, accessibilityLabel, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const iconColor = isPrimary ? color.accentFg : isDanger ? color.negative : color.text1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        !isPrimary && !isDanger && styles.secondary,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={iconColor} /> : icon(iconColor)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TAP_TARGET,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: TAP_TARGET / 2,
  },
  primary: {
    backgroundColor: color.accent,
  },
  secondary: {
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  danger: {
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.negative,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
