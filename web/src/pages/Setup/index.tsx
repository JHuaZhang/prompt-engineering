import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { getTempToken, removeTempToken, setToken } from '@/utils/token';
import { useAuthStore } from '@/store/auth';

export default function Setup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  const handleSubmit = async (values: { username: string; password: string }) => {
    const tempToken = getTempToken();
    if (!tempToken) {
      message.error('验证已过期，请重新登录');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.setup({
        username: values.username,
        password: values.password,
      });
      setToken(result.token);
      removeTempToken();
      await restoreSession();
      message.success('设置成功');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '设置失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 40 }}>🚀</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2d3748', margin: '16px 0 8px' }}>
            首次登录设置
          </h1>
          <p style={{ fontSize: 14, color: '#718096' }}>
            请设置您的用户名和密码
          </p>
        </div>

        <Form name="setup" onFinish={handleSubmit} size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 64, message: '用户名 2-64 个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 128, message: '密码 6-128 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              完成设置
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
