import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = 'Something went wrong.', onRetry }: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center">Oops</Text>
      <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">{message}</Text>
      {onRetry ? (
        <Button className="mt-5" onPress={onRetry} variant="secondary">
          Try again
        </Button>
      ) : null}
    </View>
  );
}
