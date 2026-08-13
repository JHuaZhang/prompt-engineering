import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import HeaderBar from './HeaderBar';

const { Content } = Layout;

export default function MainLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <HeaderBar />
      <Content style={{ margin: '24px', padding: '24px', background: '#fff', borderRadius: '8px' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}