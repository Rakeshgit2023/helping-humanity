import { Redirect, router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ROUTES } from '@/constants/routes';
import { RaisedStage } from '@/features/request/components/RaisedStage';
import { RaisingStage } from '@/features/request/components/RaisingStage';
import { SearchingStage } from '@/features/request/components/SearchingStage';
import { useRequestStore } from '@/features/request/store/requestStore';

/** One screen, three stages: raising → raised → searching. The store says which. */
export default function RequestFlowScreen() {
  const { request, draft, stage, setStage, startSearch, cancel } = useRequestStore();

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
