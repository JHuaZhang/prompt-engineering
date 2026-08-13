import { http } from './request';
import type { DashboardStatsVO, ExecutionRecordVO } from '@/types/dashboard';

export const dashboardApi = {
  stats: () =>
    http.get<DashboardStatsVO>('/dashboard/stats'),

  recentExecutions: () =>
    http.get<ExecutionRecordVO[]>('/dashboard/recent-executions'),
};