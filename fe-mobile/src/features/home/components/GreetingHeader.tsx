import { Bell } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { brand } from '@/theme';

interface GreetingHeaderProps {
  name: string;
  hasUnread: boolean;
  onPressBell: () => void;
}

export function GreetingHeader({ name, hasUnread, onPressBell }: GreetingHeaderProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View>
        <Text className="text-sm text-ink-soft">Namaste 👋</Text>
        <Text className="text-xl font-bold text-ink">{name}</Text>
      </View>
      <Pressable onPress={onPressBell} hitSlop={12} accessibilityLabel="Notifications">
        <Bell size={22} color={brand.ink} />
        {hasUnread && <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-clay" />}
      </Pressable>
    </View>
  );
}
