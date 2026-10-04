import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'idle' || status === 'loading') {
    return <Loading />;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
