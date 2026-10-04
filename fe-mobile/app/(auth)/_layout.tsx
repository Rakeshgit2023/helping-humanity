import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Redirect href="/(protected)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
