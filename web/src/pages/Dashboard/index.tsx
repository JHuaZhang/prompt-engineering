import { useEffect, useState } from 'react';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardStatsVO, ExecutionRecordVO } from '@/types/dashboard';
import StatCards from './StatCards';
import RecentExecutions from './RecentExecutions';
import QuickActions from './QuickActions';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsVO | null>(null);
  const [executions, setExecutions] = useState<ExecutionRecordVO[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [executionsLoading, setExecutionsLoading] = useState(true);

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchExecutions = async () => {
    setExecutionsLoading(true);
    try {
      const data = await dashboardApi.recentExecutions();
      setExecutions(data);
    } catch {
      setExecutions([]);
    } finally {
      setExecutionsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchExecutions();
  }, []);

  return (
    <div>
      <StatCards
        stats={stats}
        loading={statsLoading}
        error={statsError}
        onRetry={fetchStats}
      />
      <QuickActions />
      <RecentExecutions data={executions} loading={executionsLoading} />
    </div>
  );
}