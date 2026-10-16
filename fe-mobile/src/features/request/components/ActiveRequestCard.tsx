import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { getCategory } from '../constants/request.constants';
import type { HelpRequest } from '../types/request.types';
import { StatusPill } from './Tags';

const STATUS_LINE: Record<HelpRequest['status'], string> = {
  broadcasted: 'Waiting for a volunteer to accept…',
  accepted: 'A volunteer is on the way',
  completed: 'Completed 🎉',
};

/** Home banner shown instead of "Raise a request" while a request is live. */
export function ActiveRequestCard({
  request,
  onPress,
}: {
  request: HelpRequest;
  onPress: () => void;
}) {
  const cat = getCategory(request.categoryId);
  const title =
    request.description.length > 34 ? `${request.description.slice(0, 34)}…` : request.description;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-4 active:opacity-90"
      style={{ backgroundColor: cat.accent }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-base font-bold text-white">{title}</Text>
        <StatusPill status={request.status} />
      </View>
      <Text className="mt-2 text-sm text-white/80">{STATUS_LINE[request.status]}</Text>
      <View className="mt-2 flex-row items-center gap-1">
        <Text className="text-sm font-semibold text-white">View details</Text>
        <ChevronRight size={14} color="#fff" />
      </View>
    </Pressable>
  );
}
