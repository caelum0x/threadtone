import { Pressable, StyleSheet, Text } from 'react-native';

import { color, radius, space, type as textType } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.base, selected && styles.selected]}
    >
      <Text style={[textType.caption, { color: selected ? color.accentFg : color.text2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  selected: {
    backgroundColor: color.accent,
    borderColor: color.accent,
  },
});
