import { Heart, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, Stack } from 'expo-router';

import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { Screen } from '@/components/ui/Screen';
import { CategoryGrid } from '@/features/home/components/CategoryGrid';
import { GreetingHeader } from '@/features/home/components/GreetingHeader';
import { ImpactCard } from '@/features/home/components/ImpactCard';
import { NearbyBanner } from '@/features/home/components/NearbyBanner';
import { StatTile } from '@/features/home/components/StatTile';
import { VolunteerStrip } from '@/features/home/components/VolunteerStrip';
import { useHome } from '@/features/home/hooks/useHome';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES, requestFormRoute } from '@/constants/routes';
import { ActiveRequestCard } from '@/features/request/components/ActiveRequestCard';
import { NewRequestSheet } from '@/features/request/components/NewRequestSheet';
import { useRequestStore } from '@/features/request/store/requestStore';
import { brand } from '@/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useHome();
  const request = useRequestStore((s) => s.request);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openForm = (categoryId: string) => {
    setSheetOpen(false);
    router.push(requestFormRoute(categoryId));
  };

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  return (
    <Screen padded={false} backgroundClassName="bg-paper">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <GreetingHeader
          name={user?.firstName ?? 'Friend'}
          hasUnread
          onPressBell={() => {}} // TODO: notifications screen
        />
        <View className="flex-row gap-2">
          <StatTile
            icon={Heart}
            label="Lives touched today"
            value={String(data.stats.livesTouchedToday)}
            accent={brand.clay}
          />
          <StatTile
            icon={Users}
            label="Volunteers online"
            value={data.stats.volunteersOnline.toLocaleString()}
            accent={brand.teal}
          />
        </View>
        {request ? (
          <ActiveRequestCard request={request} onPress={() => router.push(ROUTES.activity)} />
        ) : (
          <NearbyBanner radiusKm={data.nearbyRadiusKm} onRaiseRequest={() => setSheetOpen(true)} />
        )}
        <VolunteerStrip volunteers={data.volunteers} extra={data.volunteersExtra} />
        <ImpactCard
          items={data.impact}
          livesTouched={data.stats.livesTouchedToday}
          onSeeAll={() => router.push(ROUTES.impact)}
        />
        <CategoryGrid onSelect={(c) => openForm(c.id)} disabled={!!request} />
      </ScrollView>
      <NewRequestSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={openForm}
      />
    </Screen>
  );
}
