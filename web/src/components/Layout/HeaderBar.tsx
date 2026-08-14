import { Layout, Menu, Dropdown, Avatar, Space, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const { Header } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

/** 所有可导航的 key（用于 onClick 判断） */
const NAVIGABLE_KEYS = [
  '/dashboard', '/templates', '/templates/versions',
  '/debug', '/debug-wizard',
  '/experiments', '/evaluation', '/usage', '/test-center',
  '/users',
];

function getMenuItems(userRole: string | undefined): MenuItem[] {
  const items: MenuItem[] = [
    { key: '/dashboard', label: '工作台' },
    {
      key: 'templates-group',
      label: '模板管理',
      children: [
        { key: '/templates', label: '模板列表' },
        { key: '/templates/versions', label: '版本管理', disabled: true },
      ],
    },
    {
      key: 'debug-group',
      label: '调试执行',
      children: [
        { key: '/debug', label: '即时调试' },
        { key: '/debug-wizard', label: '调试向导', disabled: true },
      ],
    },
    {
      key: 'experiment-group',
      label: '实验评估',
      children: [
        { key: '/experiments', label: '对比实验', disabled: true },
        { key: '/evaluation', label: '评估面板', disabled: true },
        { key: '/usage', label: '用量看板', disabled: true },
      ],
    },
    {
      key: 'test-group',
      label: '测试中心',
      children: [
        { key: '/test-center', label: '测试用例', disabled: true },
      ],
    },
  ];

  if (userRole === 'root' || userRole === 'admin') {
    items.push({ key: '/users', label: '用户管理' });
  }

  return items;
}

export default function HeaderBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const menuItems = getMenuItems(user?.role);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (NAVIGABLE_KEYS.includes(key)) {
      navigate(key);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user',
      label: user?.email ?? '未知用户',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const displayName = user?.username ?? user?.email ?? '用户';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 水平导航菜单 */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
      />

      {/* 用户信息 */}
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer', marginLeft: '16px' }}>
          <Avatar
            size="small"
            style={{
              backgroundColor: '#667eea',
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600,
              userSelect: 'none',
            }}
          >
            {initial}
          </Avatar>
          <Text>{displayName}</Text>
        </Space>
      </Dropdown>
    </Header>
  );
}