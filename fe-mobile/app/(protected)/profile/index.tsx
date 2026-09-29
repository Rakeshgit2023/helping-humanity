import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/ui/ErrorView';
import { Loading } from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/layout/Header';
import { useProfile } from '@/features/user/hooks/useProfile';

export default function ProfileScreen() {
  const { data: profile, isLoading, isError, refetch } = useProfile();

  return (
    <Screen>
      <Header title="Profile" />

      {isLoading ? <Loading fullscreen={false} /> : null}
      {isError ? <ErrorView onRetry={() => refetch()} /> : null}

      {profile ? (
        <Card className="mt-4">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {profile.name}
          </Text>
          <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profile.email}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
