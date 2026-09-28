import { Image, Text, View } from 'react-native';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View className="items-center pb-4 pt-6">
      <Image source={require('../../../../assets/logo.png')} className="mb-3 h-32 w-48" resizeMode="contain" />
      <Text className="text-2xl font-bold text-ink">{title}</Text>
      <Text className="mt-1.5 px-6 text-center text-base text-ink-soft">{subtitle}</Text>
    </View>
  );
}
