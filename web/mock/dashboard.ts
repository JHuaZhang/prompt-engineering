import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

export default [
  {
    url: '/api/v1/dashboard/stats',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: {
          template_count: Mock.Random.integer(8, 24),
          execution_count_month: Mock.Random.integer(120, 380),
          active_model_count: Mock.Random.integer(3, 7),
          avg_latency_ms: Mock.Random.integer(800, 3500),
        },
        message: 'success',
      };
    },
  },
  {
    url: '/api/v1/dashboard/recent-executions',
    method: 'get',
    response: () => {
      const templates = ['客服回复模板', '代码审查模板', '情感分析模板', '摘要生成模板', '翻译模板'];
      const models = ['gpt-4o', 'claude-3.5-sonnet', 'qwen-max', 'deepseek-chat', 'moonshot-v1-8k'];
      const statuses = ['success', 'error', 'timeout'];

      const list = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        template_name: Mock.Random.pick(templates),
        model_name: Mock.Random.pick(models),
        status: Mock.Random.pick(statuses),
        latency_ms: Mock.Random.integer(200, 5000),
        total_tokens: Mock.Random.integer(100, 4000),
        created_at: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      }));

      return {
        code: 0,
        data: list,
        message: 'success',
      };
    },
  },
] as MockMethod[];