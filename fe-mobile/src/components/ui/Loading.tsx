import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingProps {
  label?: string;
  fullscreen?: boolean;
}

export function Loading({ label, fullscreen = true }: LoadingProps) {
  return (
    <View className={`items-center justify-center ${fullscreen ? 'flex-1' : 'py-8'}`}>
      <ActivityIndicator size="large" color="#000000" />
      {label ? (
        <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">{label}</Text>
      ) : null}
    </View>
  );
}
