import { Text, View } from 'react-native';

interface HeaderProps {
  title: string;
  right?: React.ReactNode;
}

export function Header({ title, right }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{title}</Text>
      {right}
    </View>
  );
}
