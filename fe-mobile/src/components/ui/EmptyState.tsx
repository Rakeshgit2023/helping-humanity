import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-5" onPress={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
