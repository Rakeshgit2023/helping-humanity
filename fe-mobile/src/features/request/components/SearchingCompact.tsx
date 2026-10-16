import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { CATEGORY_DEFAULTS, getCategory, RADAR_VOLUNTEERS } from '../constants/request.constants';
import { useElapsed } from '../hooks/useElapsed';
import { getSearchState } from '../hooks/useSearchState';
import type { HelpRequest } from '../types/request.types';
import { AnimatedDots } from './AnimatedDots';
import { RadarMap, SearchProgressBar } from './RadarMap';

/** Small radar shown inside the Activity card. Tap the map to expand. */
export function SearchingCompact({
  request,
  onExpand,
}: {
  request: HelpRequest;
  onExpand: () => void;
}) {
  const cat = getCategory(request.categoryId);
  const elapsed = useElapsed(request.searchStartedAt);
  const { step, found, notified } = getSearchState(elapsed);

  return (
    <View className="-mx-3 -mb-3 mt-3 overflow-hidden rounded-b-2xl border-t border-line">
      <Pressable onPress={onExpand} accessibilityLabel="Open live search">
        <RadarMap
          accent={cat.accent}
          emoji={CATEGORY_DEFAULTS[request.categoryId]?.emoji ?? '📍'}
          elapsed={elapsed}
          height={190}
        />
      </Pressable>
      <SearchProgressBar accent={cat.accent} />
      <View className="bg-white px-3 py-3">
        <Animated.View key={step.text} entering={FadeIn.duration(250)}>
          <Text className="text-base font-bold text-ink">
            {step.text}
            <AnimatedDots />
          </Text>
        </Animated.View>
        <Text className="mt-0.5 text-xs text-ink-soft">{step.sub}</Text>
        <View className="mt-2.5 flex-row items-center justify-between">
          <View className="flex-row">
            {found.slice(0, 5).map((_, i) => {
              const p = RADAR_VOLUNTEERS[i % RADAR_VOLUNTEERS.length];
              return (
                <View
                  key={i}
                  className="h-6 w-6 items-center justify-center rounded-full border-2 border-white"
                  style={{ backgroundColor: p.accent, marginLeft: i === 0 ? 0 : -8 }}
                >
                  <Text className="text-[10px] font-bold text-white">{p.name[0]}</Text>
                </View>
              );
            })}
          </View>
          <Text className="text-xs font-semibold text-ink-soft">
            <Text className="text-ink">{notified}</Text> volunteers notified
          </Text>
        </View>
      </View>
    </View>
  );
}
