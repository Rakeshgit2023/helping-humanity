import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { brand } from '@/theme';

import { getCategory } from '../constants/request.constants';
import { AnimatedDots } from './AnimatedDots';

const CHECKS = ['Checking your details', 'Pinning your location', 'Creating your request'];

export function RaisingStage({ categoryId }: { categoryId: string }) {
  const cat = getCategory(categoryId);
  const Icon = cat.icon;
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [spin]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute' }, spinStyle]}>
          <Svg width={112} height={112} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="44" stroke={brand.line} strokeWidth="6" fill="none" />
            <Circle
              cx="50"
              cy="50"
              r="44"
              stroke={cat.accent}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="90 190"
            />
          </Svg>
        </Animated.View>
        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: cat.soft }}
        >
          <Icon size={32} color={cat.accent} />
        </View>
      </View>

      <Text className="mt-6 text-xl font-extrabold text-ink">
        Raising your request
        <AnimatedDots />
      </Text>
      <Text className="mt-1 text-sm text-ink-soft">This takes just a moment</Text>

      <View className="mt-6 w-full gap-3">
        {CHECKS.map((c, i) => (
          <Animated.View
            key={c}
            entering={FadeIn.delay(i * 400).duration(300)}
            className="flex-row items-center gap-2.5"
          >
            <View className="h-5 w-5 items-center justify-center rounded-full bg-leaf">
              <Check size={12} color="#fff" strokeWidth={3} />
            </View>
            <Text className="text-sm font-semibold text-ink">{c}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
