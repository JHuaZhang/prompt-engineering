import { Card, Space, Button } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card title="快捷入口" style={{ marginTop: 16 }}>
      <Space size="middle">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/templates/new')}
        >
          新建模板
        </Button>
        <Button
          icon={<ThunderboltOutlined />}
          onClick={() => navigate('/debug')}
        >
          去调试
        </Button>
      </Space>
    </Card>
  );
}