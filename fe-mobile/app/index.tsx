import { Redirect } from 'expo-router';

import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const status = useAuthStore((state) => state.status);

  if (status === 'idle' || status === 'loading') {
    return <Loading />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(protected)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
