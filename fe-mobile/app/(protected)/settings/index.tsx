import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <Screen>
      <Header title="Settings" />
      <Button className="mt-4" variant="danger" onPress={() => logout()}>
        Log out
      </Button>
    </Screen>
  );
}
