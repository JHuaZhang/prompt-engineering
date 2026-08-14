import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { getTempToken, removeTempToken, setToken } from '@/utils/token';
import { useAuthStore } from '@/store/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  const handleSubmit = async (values: { newPassword: string }) => {
    const tempToken = getTempToken();
    if (!tempToken) {
      message.error('验证已过期，请重新登录');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.resetPassword({
        new_password: values.newPassword,
      });
      setToken(result.token);
      removeTempToken();
      await restoreSession();
      message.success('密码重置成功');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '重置失败';
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
          <span style={{ fontSize: 40 }}>🔑</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2d3748', margin: '16px 0 8px' }}>
            设置新密码
          </h1>
          <p style={{ fontSize: 14, color: '#718096' }}>
            您的密码已被管理员重置，请设置新密码
          </p>
        </div>

        <Form name="reset-password" onFinish={handleSubmit} size="large">
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, max: 128, message: '密码 6-128 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
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
              确认
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
