/** 工作台统计数据 */
interface DashboardStatsVO {
  template_count: number;
  execution_count_month: number;
  active_model_count: number;
  avg_latency_ms: number;
}

/** 执行记录 */
interface ExecutionRecordVO {
  id: number;
  template_name: string;
  model_name: string;
  status: 'success' | 'error' | 'timeout';
  latency_ms: number;
  total_tokens: number;
  created_at: string;
}

export { type DashboardStatsVO, type ExecutionRecordVO };