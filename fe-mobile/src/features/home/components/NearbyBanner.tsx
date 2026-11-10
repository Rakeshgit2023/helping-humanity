import { MapPin, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { brand } from '@/theme';

interface NearbyBannerProps {
  radiusKm: number;
  onRaiseRequest: () => void;
}

export function NearbyBanner({ radiusKm, onRaiseRequest }: NearbyBannerProps) {
  return (
    <View className="overflow-hidden rounded-2xl bg-teal p-4">
      <Text className="text-base font-bold text-white">Nearby volunteers ready to help</Text>
      <View className="mt-1 flex-row items-center gap-1">
        <MapPin size={13} color="rgba(255,255,255,0.7)" />
        <Text className="text-xs text-white/70">Active within {radiusKm} km of you</Text>
      </View>
      <Pressable
        onPress={onRaiseRequest}
        className="mt-3 flex-row items-center gap-1 self-start rounded-full bg-marigold px-4 py-2 active:opacity-80"
      >
        <Plus size={14} color={brand.ink} />
        <Text className="text-xs font-bold text-ink">Raise a request</Text>
      </Pressable>
    </View>
  );
}
