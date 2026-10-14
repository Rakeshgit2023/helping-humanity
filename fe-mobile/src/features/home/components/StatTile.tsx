import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}

export function StatTile({ icon: Icon, label, value, accent }: StatTileProps) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl border border-line bg-white p-3">
      <Icon size={18} color={accent} />
      <Text className="text-base font-bold text-ink">{value}</Text>
      <Text className="text-center text-xs text-ink-soft">{label}</Text>
    </View>
  );
}
