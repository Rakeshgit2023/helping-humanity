import { Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { brand } from '@/theme';

import { RADAR_VOLUNTEERS } from '../constants/request.constants';
import { getSearchState } from '../hooks/useSearchState';

/** A ring that grows from the pin and fades out. `delay` staggers the three rings. */
function PulseRing({ size, color, delay }: { size: number; color: string; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false),
    );
    return () => cancelAnimation(progress);
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.9 * (1 - progress.value),
    transform: [{ scale: 0.15 + 1.1 * progress.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          backgroundColor: 'rgba(11,59,120,0.05)',
        },
        style,
      ]}
    />
  );
}

/** Slowly rotating translucent wedge — the "radar beam". */
function Sweep({ size, color }: { size: number; color: string }) {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(withTiming(360, { duration: 2800, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(angle);
  }, [angle]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, opacity: 0.2 }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M50 50 L50 0 A50 50 0 0 0 6.7 25 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

function LiveBadge() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
      <Animated.View
        style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand.clay }, style]}
      />
      <Text className="text-xs font-bold text-ink">LIVE</Text>
    </View>
  );
}

function MapBackdrop() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute' }}
    >
      <Rect x="0" y="0" width="100" height="100" fill="#E8EEE6" />
      <Rect x="6" y="8" width="22" height="16" rx="2" fill="#DCE6D6" />
      <Rect x="66" y="72" width="26" height="20" rx="2" fill="#D3E4CC" />
      <Rect x="62" y="6" width="30" height="14" rx="2" fill="#E1E6EC" />
      <Rect x="18" y="80" width="20" height="14" rx="2" fill="#E1E6EC" />
      <Path d="M0 38 L100 30" stroke="#FFFFFF" strokeWidth="5" fill="none" />
      <Path d="M0 76 L100 68" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      <Path d="M44 0 L52 100" stroke="#FFFFFF" strokeWidth="5" fill="none" />
      <Path d="M16 0 L10 100" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
      <Path d="M84 0 L90 100" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
      <Path d="M0 58 Q 30 50 60 56 T 100 50" stroke="#F6E7B5" strokeWidth="2" fill="none" />
    </Svg>
  );
}

interface RadarMapProps {
  accent: string;
  emoji: string;
  elapsed: number;
  height?: number;
  /** Big = full-screen version: larger rings/pin and distance labels on dots. */
  big?: boolean;
}

export function RadarMap({ accent, emoji, elapsed, height = 210, big = false }: RadarMapProps) {
  const { found, clock } = getSearchState(elapsed);
  const ring = big ? 300 : 220;
  const pin = big ? 52 : 44;

  return (
    <View style={{ height, backgroundColor: '#E8EEE6', overflow: 'hidden' }}>
      <MapBackdrop />

      {/* centred layer: beam + rings + pin all share the map's centre */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sweep size={ring * 1.2} color={accent} />
        {[0, 800, 1600].map((d) => (
          <PulseRing key={d} size={ring} color={accent} delay={d} />
        ))}
        <View style={{ alignItems: 'center', marginTop: -(pin + 8) / 2 }}>
          <View
            style={{
              width: pin,
              height: pin,
              borderRadius: pin / 2,
              backgroundColor: '#fff',
              borderWidth: 3,
              borderColor: accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: big ? 24 : 20 }}>{emoji}</Text>
          </View>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 8,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: accent,
              marginTop: -1,
            }}
          />
        </View>
      </View>

      {found.map((d, i) => {
        const person = RADAR_VOLUNTEERS[i % RADAR_VOLUNTEERS.length];
        return (
          <Animated.View
            key={i}
            entering={ZoomIn.duration(450)}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              marginLeft: -14,
              marginTop: -14,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: person.accent,
                borderWidth: 2,
                borderColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-xs font-bold text-white">{person.name[0]}</Text>
            </View>
            {big && (
              <View className="mt-0.5 rounded-full bg-white px-1.5">
                <Text className="text-[10px] font-bold text-ink">{d.km}</Text>
              </View>
            )}
          </Animated.View>
        );
      })}

      <View style={{ position: 'absolute', top: 12, left: 12 }}>
        <LiveBadge />
      </View>
      <View
        className="flex-row items-center gap-1 rounded-full bg-white px-2.5 py-1"
        style={{ position: 'absolute', top: 12, right: 12 }}
      >
        <Clock size={12} color={brand.ink} />
        <Text className="text-xs font-bold text-ink" style={{ fontVariant: ['tabular-nums'] }}>
          {clock}
        </Text>
      </View>
    </View>
  );
}

/** Thin bar with a block sliding left → right forever. */
export function SearchProgressBar({ accent }: { accent: string }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!width) return;
    x.value = -width * 0.4;
    x.value = withRepeat(
      withTiming(width, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [width, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: 4, overflow: 'hidden', backgroundColor: 'rgba(11,59,120,0.1)' }}
    >
      <Animated.View style={[{ height: 4, width: '40%', backgroundColor: accent }, style]} />
    </View>
  );
}
