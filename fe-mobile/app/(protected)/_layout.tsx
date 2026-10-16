import { Redirect, Tabs } from 'expo-router';
import { Heart, Home, MessageCircle, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui/Loading';
import { useLocationSharing } from '@/features/location/hooks/useLocationSharing';
import { useAuthStore } from '@/store/authStore';
import { brand } from '@/theme';

export default function ProtectedLayout() {
  const status = useAuthStore((state) => state.status);
  const insets = useSafeAreaInsets();

  useLocationSharing();

  if (status === 'idle' || status === 'loading') {
    return <Loading />;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.teal,
        tabBarInactiveTintColor: '#9A9181',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: brand.line,
          // grow with the device's bottom inset (home indicator / gesture bar)
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="impact/index"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity/index"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      {/* full-screen raise flow: no tab button and no tab bar while it's open */}
      <Tabs.Screen name="request/form" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="request/flow" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      {/* reachable by route, but no tab button */}
      <Tabs.Screen name="settings/index" options={{ href: null }} />
    </Tabs>
  );
}
