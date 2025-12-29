import { GradeDistributionChart } from '@/components/dashboard/grade-distribution-chart';
import { PerformanceTable } from '@/components/dashboard/performance-table';

export default function PerformancePage() {
  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold font-headline">Performance Tracking</h1>
        <p className="text-muted-foreground">Analyze student performance and generate grade reports.</p>
      </div>
      <GradeDistributionChart />
      <PerformanceTable />
    </div>
  );
}
