import { router } from 'expo-router';
import { Image, ScrollView, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ROUTES } from '@/constants/routes';
import { SearchingCompact } from '@/features/request/components/SearchingCompact';
import { PriorityTag, StatusPill } from '@/features/request/components/Tags';
import { CATEGORY_DEFAULTS, getCategory } from '@/features/request/constants/request.constants';
import { useRequestStore } from '@/features/request/store/requestStore';

export default function ActivityScreen() {
  const request = useRequestStore((s) => s.request);
  const setStage = useRequestStore((s) => s.setStage);

  if (!request) {
    return (
      <Screen backgroundClassName="bg-paper">
        <Header title="Activity" />
        <EmptyState
          title="No active requests"
          description="Raise one from Home and it will appear here."
        />
      </Screen>
    );
  }

  const cat = getCategory(request.categoryId);
  const expand = () => {
    setStage('searching');
    router.push(ROUTES.requestFlow);
  };

  return (
    <Screen padded={false} backgroundClassName="bg-paper">
      <ScrollView contentContainerClassName="px-5 pb-8">
        <Header title="Activity" />
        <View className="rounded-2xl border border-line bg-white p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold" style={{ color: cat.accent }}>
              {cat.label}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <PriorityTag priority={request.priority} />
              <StatusPill status={request.status} />
            </View>
          </View>

          <View
            className="relative mt-2 h-[100px] items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: cat.soft }}
          >
            {request.photos[0] ? (
              <Image
                source={{ uri: request.photos[0].uri }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text className="text-4xl">{CATEGORY_DEFAULTS[request.categoryId]?.emoji}</Text>
            )}
            {request.photos.length > 1 && (
              <View className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-ink">
                  +{request.photos.length - 1} photo
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-2 text-sm text-ink">{request.description}</Text>
          {request.bloodGroup && (
            <Text className="mt-1 text-xs font-bold text-clay">
              Blood group: {request.bloodGroup}
            </Text>
          )}

          {request.status === 'broadcasted' && request.searchStartedAt && (
            <SearchingCompact request={request} onExpand={expand} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
