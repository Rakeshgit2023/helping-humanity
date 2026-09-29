import { Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen>
      <Header title="Home" />
      <Card className="mt-4">
        <Text className="text-base text-gray-900 dark:text-white">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}.
        </Text>
      </Card>
      <Button className="mt-4" variant="danger" onPress={() => logout()}>
        Log out
      </Button>
    </Screen>
  );
}
