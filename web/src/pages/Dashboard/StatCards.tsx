import { Row, Col, Card, Statistic, Skeleton, Result, Button } from 'antd';
import {
  FileTextOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { DashboardStatsVO } from '@/types/dashboard';

interface StatCardsProps {
  stats: DashboardStatsVO | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export default function StatCards({ stats, loading, error, onRetry }: StatCardsProps) {
  if (loading) {
    return (
      <Row gutter={16}>
        {[0, 1, 2, 3].map((i) => (
          <Col key={i} span={6}>
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (error) {
    return (
      <Result
        status="warning"
        title="数据加载失败"
        extra={
          <Button type="primary" onClick={onRetry}>
            重试
          </Button>
        }
      />
    );
  }

  const cards = [
    {
      title: '模板总数',
      value: stats?.template_count ?? 0,
      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
    {
      title: '本月执行次数',
      value: stats?.execution_count_month ?? 0,
      icon: <ThunderboltOutlined style={{ color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: '活跃模型数',
      value: stats?.active_model_count ?? 0,
      icon: <RobotOutlined style={{ color: '#722ed1' }} />,
      color: '#f9f0ff',
    },
    {
      title: '平均耗时',
      value: stats?.avg_latency_ms ?? 0,
      suffix: 'ms',
      icon: <ClockCircleOutlined style={{ color: '#fa8c16' }} />,
      color: '#fff7e6',
    },
  ];

  return (
    <Row gutter={16}>
      {cards.map((card) => (
        <Col key={card.title} span={6}>
          <Card>
            <Statistic
              title={card.title}
              value={card.value}
              suffix={card.suffix}
              prefix={card.icon}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}