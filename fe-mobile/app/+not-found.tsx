import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-white px-6 dark:bg-gray-900">
        <Text className="text-xl font-semibold text-gray-900 dark:text-white">
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/" className="text-sm font-semibold text-gray-900 dark:text-white">
          Go to home screen
        </Link>
      </View>
    </>
  );
}
