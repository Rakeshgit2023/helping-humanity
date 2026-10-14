import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ROUTES } from '@/constants/routes';
import { RequestForm } from '@/features/request/components/RequestForm';
import { useRequestStore } from '@/features/request/store/requestStore';
import type { RequestDraft } from '@/features/request/types/request.types';

export default function RequestFormScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const raise = useRequestStore((s) => s.raise);

  const handleSubmit = (draft: RequestDraft) => {
    // Start raising, then show the flow screen straight away; it renders from the draft.
    raise(draft).catch(() => {
      Alert.alert('Could not raise request', 'Please check your connection and try again.');
      router.replace(ROUTES.home);
    });
    router.replace(ROUTES.requestFlow);
  };

  return (
    <Screen padded={false} backgroundClassName="bg-paper">
      <RequestForm
        categoryId={category ?? 'animal'}
        onBack={() => router.back()}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
