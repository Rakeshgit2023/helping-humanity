import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { brand } from '@/theme';

import type { ImpactPreview } from '../types/home.types';

interface ImpactCardProps {
  items: ImpactPreview[];
  livesTouched: number;
  onSeeAll: () => void;
}

export function ImpactCard({ items, livesTouched, onSeeAll }: ImpactCardProps) {
  return (
    <View className="rounded-2xl border border-line bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-ink">Community Impact</Text>
        <Pressable onPress={onSeeAll} className="flex-row items-center">
          <Text className="text-xs font-semibold text-teal">See all</Text>
          <ChevronRight size={14} color={brand.teal} />
        </Pressable>
      </View>
      <View className="mb-3 flex-row gap-2">
        {items.map((it) => (
          <View
            key={it.id}
            className="h-16 flex-1 items-center justify-center rounded-xl"
            style={{ backgroundColor: it.soft }}
          >
            <Text className="text-3xl">{it.emoji}</Text>
          </View>
        ))}
      </View>
      <Text className="text-xs text-ink-soft">
        <Text className="font-bold text-clay">{livesTouched}</Text> lives touched today across the city
      </Text>
    </View>
  );
}
