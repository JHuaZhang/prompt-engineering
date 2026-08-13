import { Card, Table, Tag, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ExecutionRecordVO } from '@/types/dashboard';

const STATUS_MAP: Record<ExecutionRecordVO['status'], { color: string; text: string }> = {
  success: { color: 'green', text: '成功' },
  error: { color: 'red', text: '错误' },
  timeout: { color: 'orange', text: '超时' },
};

const columns: ColumnsType<ExecutionRecordVO> = [
  {
    title: '模板名称',
    dataIndex: 'template_name',
    key: 'template_name',
  },
  {
    title: '模型',
    dataIndex: 'model_name',
    key: 'model_name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: ExecutionRecordVO['status']) => {
      const item = STATUS_MAP[status];
      return <Tag color={item.color}>{item.text}</Tag>;
    },
  },
  {
    title: '耗时(ms)',
    dataIndex: 'latency_ms',
    key: 'latency_ms',
  },
  {
    title: 'Token 消耗',
    dataIndex: 'total_tokens',
    key: 'total_tokens',
  },
  {
    title: '执行时间',
    dataIndex: 'created_at',
    key: 'created_at',
  },
];

interface RecentExecutionsProps {
  data: ExecutionRecordVO[];
  loading: boolean;
}

export default function RecentExecutions({ data, loading }: RecentExecutionsProps) {
  return (
    <Card title="最近执行记录" style={{ marginTop: 16 }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: <Empty description="暂无执行记录" />,
        }}
      />
    </Card>
  );
}