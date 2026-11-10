import { Text, View } from 'react-native';

import type { NearbyVolunteer } from '../types/home.types';

interface VolunteerStripProps {
  volunteers: NearbyVolunteer[];
  extra: number;
}

export function VolunteerStrip({ volunteers, extra }: VolunteerStripProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-bold text-ink">Volunteers active near you</Text>
      <View className="flex-row">
        {volunteers.map((v, i) => (
          <View
            key={v.id}
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-paper"
            style={{ backgroundColor: v.accent, marginLeft: i === 0 ? 0 : -8 }}
          >
            <Text className="text-xs font-bold text-white">{v.name[0]}</Text>
          </View>
        ))}
        {extra > 0 && (
          <View className="-ml-2 h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-white">
            <Text className="text-xs font-bold text-ink-soft">+{extra}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
