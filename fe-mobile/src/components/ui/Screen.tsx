import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  className?: string;
  padded?: boolean;
  backgroundClassName?: string;
}

export function Screen({
  children,
  className = '',
  padded = true,
  backgroundClassName = 'bg-white dark:bg-gray-900',
}: ScreenProps) {
  return (
    <SafeAreaView className={`flex-1 ${backgroundClassName}`}>
      <View className={`flex-1 ${padded ? 'px-5 py-6' : ''} ${className}`}>{children}</View>
    </SafeAreaView>
  );
}
