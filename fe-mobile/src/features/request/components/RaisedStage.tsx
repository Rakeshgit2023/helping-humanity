import { Check, Clock, MapPin, Navigation } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { CATEGORY_DEFAULTS, getCategory } from '../constants/request.constants';
import type { HelpRequest } from '../types/request.types';
import { PriorityTag } from './Tags';

const COUNTDOWN = 3;

export function RaisedStage({ request, onFind }: { request: HelpRequest; onFind: () => void }) {
  const cat = getCategory(request.categoryId);
  const [count, setCount] = useState(COUNTDOWN);
  const fill = useSharedValue(0);

  // Button background fills over the countdown, then search starts by itself.
  useEffect(() => {
    fill.value = withTiming(1, { duration: COUNTDOWN * 1000, easing: Easing.linear });
  }, [fill]);

  useEffect(() => {
    if (count <= 0) {
      onFind();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onFind]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View className="flex-1 px-5 pb-5 pt-10">
      <View className="items-center">
        <Animated.View
          entering={ZoomIn.springify().damping(9)}
          className="h-20 w-20 items-center justify-center rounded-full bg-leaf"
          style={{
            shadowColor: '#1C7A54',
            shadowOpacity: 0.5,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Check size={40} color="#fff" strokeWidth={3} />
        </Animated.View>
        <Text className="mt-5 text-2xl font-extrabold text-ink">Request raised!</Text>
        <Text className="mt-1 text-center text-sm text-ink-soft">
          We&apos;ve got it. Now let&apos;s find someone nearby to help.
        </Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(250).duration(450)}
        className="mt-6 overflow-hidden rounded-2xl border border-line bg-white"
      >
        <View
          className="flex-row items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: cat.soft }}
        >
          <Text className="text-xs font-bold tracking-wide" style={{ color: cat.accent }}>
            REQUEST ID
          </Text>
          <Text className="text-sm font-extrabold text-ink">#{request.shortId}</Text>
        </View>
        <View className="flex-row gap-3 p-4">
          <View
            className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: cat.soft }}
          >
            {request.photos[0] ? (
              <Image
                source={{ uri: request.photos[0].uri }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text className="text-2xl">{CATEGORY_DEFAULTS[request.categoryId]?.emoji}</Text>
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Text className="text-sm font-bold" style={{ color: cat.accent }}>
                {cat.label}
              </Text>
              <PriorityTag priority={request.priority} />
            </View>
            <Text className="mt-1 text-sm text-ink">{request.description}</Text>
          </View>
        </View>
        <View className="flex-row border-t border-line">
          <View className="flex-1 flex-row items-center gap-1.5 border-r border-line px-4 py-2.5">
            <MapPin size={13} color="#5A6B85" />
            <Text className="text-xs text-ink-soft">Sector 12, near you</Text>
          </View>
          <View className="flex-1 flex-row items-center gap-1.5 px-4 py-2.5">
            <Clock size={13} color="#5A6B85" />
            <Text className="text-xs text-ink-soft">Raised {request.raisedAt}</Text>
          </View>
        </View>
      </Animated.View>

      <View className="flex-1" />

      <Pressable
        onPress={onFind}
        className="overflow-hidden rounded-xl bg-teal py-4 active:opacity-90"
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(255,255,255,0.18)',
            },
            fillStyle,
          ]}
        />
        <View className="flex-row items-center justify-center gap-2">
          <Navigation size={16} color="#fff" />
          <Text className="text-base font-bold text-white">
            Find nearby volunteers{count > 0 ? ` (${count})` : ''}
          </Text>
        </View>
      </Pressable>
      <Text className="mt-2 text-center text-xs text-ink-soft">Searching starts automatically</Text>
    </View>
  );
}
