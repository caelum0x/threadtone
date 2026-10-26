import { StyleSheet, Text, View } from 'react-native';

import { color, space, type as textType } from '../theme/tokens';
import { Button } from './Button';
import { PlusIcon } from './icons';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionAccessibilityLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, body, actionAccessibilityLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={[textType.heading, { color: color.text1, marginTop: space.md }]}>{title}</Text>
      <Text style={[textType.body, { color: color.text2, textAlign: 'center', marginTop: space.xs }]}>{body}</Text>
      {actionAccessibilityLabel && onAction ? (
        <Button
          icon={(c) => <PlusIcon color={c} />}
          accessibilityLabel={actionAccessibilityLabel}
          onPress={onAction}
          style={{ marginTop: space.lg, width: 56, paddingHorizontal: 0 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
  },
});
