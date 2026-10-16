import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { ErrorView } from '@/components/ui/ErrorView';
import { Loading } from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/features/category/hooks/useCategories';
import { RequestForm } from '@/features/request/components/RequestForm';
import { useRequestStore } from '@/features/request/store/requestStore';
import type { RequestDraft } from '@/features/request/types/request.types';
import { matchCategory } from '@/features/request/utils/matchCategory';

export default function RequestFormScreen() {
  const { category = 'animal' } = useLocalSearchParams<{ category: string }>();
  const raise = useRequestStore((s) => s.raise);
  const draft = useRequestStore((s) => s.draft);
  const { data: categories, isLoading, isError, refetch } = useCategories();

  // Tab screens stay mounted, so remount the form every time it's opened
  // to avoid showing the previous request's photos/text.
  const [formKey, setFormKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFormKey((k) => k + 1);
    }, []),
  );

  const handleSubmit = (next: RequestDraft) => {
    // Show the flow straight away; it renders from the draft while the upload runs.
    raise(next);
    router.replace(ROUTES.requestFlow);
  };

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <Screen backgroundClassName="bg-paper">
        <ErrorView message="Could not load categories." onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} backgroundClassName="bg-paper">
      <View className="flex-1">
        <RequestForm
          key={formKey}
          categoryId={category}
          backendCategory={matchCategory(category, categories)}
          categoriesLoading={isLoading}
          initial={draft?.categoryId === category ? draft : undefined}
          onBack={() => router.back()}
          onSubmit={handleSubmit}
        />
      </View>
    </Screen>
  );
}
