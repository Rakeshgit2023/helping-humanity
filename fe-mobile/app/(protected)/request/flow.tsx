import { Redirect, router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ROUTES, requestFormRoute } from '@/constants/routes';
import { RaisedStage } from '@/features/request/components/RaisedStage';
import { RaisingStage } from '@/features/request/components/RaisingStage';
import { SearchingStage } from '@/features/request/components/SearchingStage';
import { useRequestStore } from '@/features/request/store/requestStore';

/** One screen, three stages: raising → raised → searching. The store says which. */
export default function RequestFlowScreen() {
  const { request, draft, error, stage, setStage, startSearch, cancel, retry } = useRequestStore();

  // raising → raised: wait until the server replied AND the animation had time to play.
  useEffect(() => {
    if (stage !== 'raising' || !request) return;
    const t = setTimeout(() => setStage('raised'), 1700);
    return () => clearTimeout(t);
  }, [stage, request, setStage]);

  const handleMinimize = useCallback(() => {
    setStage(null);
    router.replace(ROUTES.activity);
  }, [setStage]);

  const handleCancel = useCallback(() => {
    cancel();
    router.replace(ROUTES.home);
  }, [cancel]);

  if (!request && !draft) return <Redirect href={ROUTES.home} />;

  // The upload failed: keep what the user typed and let them retry or edit.
  if (error && draft) {
    return (
      <Screen backgroundClassName="bg-paper">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-extrabold text-ink">Couldn&apos;t raise your request</Text>
          <Text className="mt-2 text-center text-sm text-ink-soft">{error}</Text>
          <Pressable
            onPress={() => retry()}
            className="mt-6 w-full items-center rounded-xl bg-teal py-3.5 active:opacity-90"
          >
            <Text className="text-base font-bold text-white">Try again</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace(requestFormRoute(draft.categoryId))}
            className="mt-2 w-full items-center rounded-xl border border-line py-3.5 active:opacity-80"
          >
            <Text className="text-base font-bold text-ink">Edit request</Text>
          </Pressable>
          <Pressable onPress={handleCancel} className="mt-2 py-3">
            <Text className="text-sm font-semibold text-clay">Discard</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} backgroundClassName={stage === 'searching' ? 'bg-white' : 'bg-paper'}>
      <View className="flex-1">
        {stage === 'raising' && <RaisingStage categoryId={(request ?? draft)!.categoryId} />}
        {stage === 'raised' && request && <RaisedStage request={request} onFind={startSearch} />}
        {stage === 'searching' && request && (
          <SearchingStage request={request} onMinimize={handleMinimize} onCancel={handleCancel} />
        )}
      </View>
    </Screen>
  );
}
