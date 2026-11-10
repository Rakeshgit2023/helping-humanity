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
      {/* max-w keeps content readable on tablets/web; on phones it fills the width */}
      <View className={`w-full max-w-xl flex-1 self-center ${padded ? 'px-5 py-6' : ''} ${className}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
