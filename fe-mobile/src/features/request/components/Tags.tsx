import { Text, View } from 'react-native';

import { brand } from '@/theme';

import type { RequestPriority, RequestStatus } from '../types/request.types';

const STATUS: Record<RequestStatus, { text: string; color: string }> = {
  broadcasted: { text: 'Broadcasted', color: brand.marigold },
  accepted: { text: 'Accepted', color: brand.teal },
  completed: { text: 'Completed', color: brand.leaf },
};

const PRIORITY_COLOR: Record<RequestPriority, string> = {
  Urgent: brand.clay,
  High: brand.marigold,
  Normal: brand.leaf,
};

// Hex + 2 digits = alpha. "22" ≈ 13% opaque, "18" ≈ 9%.
export function StatusPill({ status }: { status: RequestStatus }) {
  const { text, color } = STATUS[status];
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}22` }}>
      <Text className="text-xs font-bold" style={{ color }}>
        {text}
      </Text>
    </View>
  );
}

export function PriorityTag({ priority }: { priority: RequestPriority }) {
  const color = PRIORITY_COLOR[priority];
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}18` }}>
      <Text className="text-xs font-bold" style={{ color }}>
        {priority} priority
      </Text>
    </View>
  );
}
