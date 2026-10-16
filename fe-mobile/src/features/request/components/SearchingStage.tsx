import { ChevronDown, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';

import { brand } from '@/theme';

import {
  CATEGORY_DEFAULTS,
  getCategory,
  RADAR_VOLUNTEERS,
  SEARCH_STEPS,
} from '../constants/request.constants';
import { useElapsed } from '../hooks/useElapsed';
import { getSearchState } from '../hooks/useSearchState';
import type { HelpRequest } from '../types/request.types';
import { AnimatedDots } from './AnimatedDots';
import { RadarMap, SearchProgressBar } from './RadarMap';

interface SearchingStageProps {
  request: HelpRequest;
  onMinimize: () => void;
  onCancel: () => void;
}

export function SearchingStage({ request, onMinimize, onCancel }: SearchingStageProps) {
  const cat = getCategory(request.categoryId);
  const emoji = CATEGORY_DEFAULTS[request.categoryId]?.emoji ?? '📍';
  const elapsed = useElapsed(request.searchStartedAt);
  const { step, stepIndex, found, notified } = getSearchState(elapsed);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const stats = [
    { v: String(notified), l: 'Notified' },
    { v: String(found.length), l: 'Nearby' },
    { v: found.length ? found[0].min : '—', l: 'Closest ETA' },
  ];

  return (
    <View className="flex-1 bg-white">
      <View>
        <RadarMap accent={cat.accent} emoji={emoji} elapsed={elapsed} height={300} big />
        <Pressable
          onPress={onMinimize}
          accessibilityLabel="Minimise"
          className="absolute bottom-6 left-3 h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronDown size={18} color={brand.ink} />
        </Pressable>
        <View className="absolute bottom-6 right-3 rounded-full bg-ink px-2.5 py-1">
          <Text className="text-xs font-bold text-white">Radius {step.radius}</Text>
        </View>
      </View>
      <SearchProgressBar accent={cat.accent} />

      <ScrollView
        className="-mt-3 flex-1 rounded-t-3xl bg-white px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-line" />

        <Animated.View key={step.text} entering={FadeIn.duration(250)}>
          <Text className="text-lg font-extrabold text-ink">
            {step.text}
            <AnimatedDots />
          </Text>
        </Animated.View>
        <Text className="mt-0.5 text-sm text-ink-soft">{step.sub}</Text>

        <View className="mt-3 flex-row gap-1.5">
          {SEARCH_STEPS.map((_, i) => (
            <View key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <View
                className="h-full rounded-full"
                style={{ width: i <= stepIndex ? '100%' : '0%', backgroundColor: cat.accent }}
              />
            </View>
          ))}
        </View>

        <View className="mt-4 flex-row gap-2">
          {stats.map((s) => (
            <View key={s.l} className="flex-1 items-center rounded-xl bg-paper py-2">
              <Text className="text-base font-extrabold text-ink">{s.v}</Text>
              <Text className="text-xs text-ink-soft">{s.l}</Text>
            </View>
          ))}
        </View>

        <Text className="mb-2 mt-4 text-sm font-bold text-ink">Volunteers found nearby</Text>
        {found.length === 0 && (
          <View className="flex-row items-center gap-2 py-3">
            <ActivityIndicator size="small" color={brand.inkSoft} />
            <Text className="text-sm text-ink-soft">Scanning your area…</Text>
          </View>
        )}
        <View className="gap-2">
          {found.slice(0, 5).map((d, i) => {
            const p = RADAR_VOLUNTEERS[i % RADAR_VOLUNTEERS.length];
            const viewing = elapsed >= d.at + 2;
            const tone = viewing ? brand.leaf : brand.marigold;
            return (
              <Animated.View
                key={p.name}
                entering={SlideInLeft.duration(350)}
                className="flex-row items-center gap-3 rounded-xl border border-line px-3 py-2"
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: p.accent }}
                >
                  <Text className="text-sm font-bold text-white">{p.name[0]}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm font-bold text-ink">{p.name}</Text>
                    <ShieldCheck size={12} color={brand.leaf} />
                  </View>
                  <Text className="text-xs text-ink-soft">
                    {d.km} away · {d.min}
                  </Text>
                </View>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${tone}18` }}>
                  <Text className="text-xs font-bold" style={{ color: tone }}>
                    {viewing ? 'Viewing' : 'Notified'}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <View
          className="mt-4 flex-row items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: cat.soft }}
        >
          <Text className="text-lg">{emoji}</Text>
          <Text className="flex-1 text-xs text-ink">
            <Text className="font-bold">#{request.shortId}</Text> · {cat.label} ·{' '}
            <Text className="text-ink-soft">{request.description}</Text>
          </Text>
        </View>

        {!confirmCancel ? (
          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={() => setConfirmCancel(true)}
              className="flex-1 items-center rounded-xl border border-line py-3"
            >
              <Text className="text-sm font-bold text-clay">Cancel request</Text>
            </Pressable>
            <Pressable onPress={onMinimize} className="flex-1 items-center rounded-xl bg-teal py-3">
              <Text className="text-sm font-bold text-white">Keep searching</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View entering={FadeIn} className="mt-4 rounded-xl border border-line p-3">
            <Text className="text-sm font-bold text-ink">Cancel this request?</Text>
            <Text className="mt-0.5 text-xs text-ink-soft">
              Volunteers who were notified will no longer see it.
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => setConfirmCancel(false)}
                className="flex-1 items-center rounded-xl border border-line py-2.5"
              >
                <Text className="text-sm font-bold text-ink">Keep it</Text>
              </Pressable>
              <Pressable
                onPress={onCancel}
                className="flex-1 items-center rounded-xl bg-clay py-2.5"
              >
                <Text className="text-sm font-bold text-white">Yes, cancel</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
