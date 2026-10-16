import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/layout/Header';

export default function ImpactScreen() {
  return (
    <Screen backgroundClassName="bg-paper">
      <Header title="Community Impact" />
      <EmptyState title="Coming soon" description="Stories from volunteers will show up here." />
    </Screen>
  );
}
