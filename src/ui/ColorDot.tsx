import { StyleSheet, View } from 'react-native';

import { color } from '../theme/tokens';

interface ColorDotProps {
  hex: string;
  size?: number;
}

/** A small swatch with a hairline ring, so white/cream dots stay visible on the dark canvas. */
export function ColorDot({ hex, size = 14 }: ColorDotProps) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: hex },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderWidth: 1,
    borderColor: color.border,
  },
});
