import { OverviewStats } from '@/components/dashboard/overview-stats';
import { UpcomingClasses } from '@/components/dashboard/upcoming-classes';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <OverviewStats />
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingClasses />
        <RecentSubmissions />
      </div>
    </div>
  );
}
