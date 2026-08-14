import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Popconfirm,
  Select,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/store/auth';
import type { UserManageVO, UserRole } from '@/types/auth';

const ROLE_COLORS: Record<UserRole, string> = {
  root: 'red',
  admin: 'orange',
  user: 'blue',
};

const ROLE_LABELS: Record<UserRole, string> = {
  root: '超级管理员',
  admin: '管理员',
  user: '普通用户',
};

const STATUS_COLORS: Record<string, string> = {
  pending_setup: 'gold',
  active: 'green',
  password_reset: 'volcano',
};

const STATUS_LABELS: Record<string, string> = {
  pending_setup: '待设置',
  active: '活跃',
  password_reset: '待重设密码',
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserManageVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const { user: currentUser } = useAuthStore();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.list();
      setUsers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取用户列表失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      await userApi.create({ email: values.email });
      message.success('用户创建成功，初始密码为 123456');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchUsers();
    } catch (err) {
      if (err instanceof Error && err.message !== 'Validation failed') {
        message.error(err.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await userApi.updateRole(userId, { role: newRole });
      message.success('角色修改成功');
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '修改角色失败';
      message.error(msg);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await userApi.resetPassword(userId);
      message.success('密码已重置为 123456');
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '重置密码失败';
      message.error(msg);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await userApi.remove(userId);
      message.success('删除成功');
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败';
      message.error(msg);
    }
  };

  /** 获取可分配的角色选项 */
  const getRoleOptions = (targetUser: UserManageVO) => {
    const isRoot = currentUser?.role === 'root';
    const allRoles: UserRole[] = ['root', 'admin', 'user'];

    if (isRoot) {
      // root can assign any role except to root users
      if (targetUser.role === 'root') return [];
      return allRoles.map((r) => ({
        value: r,
        label: ROLE_LABELS[r],
      }));
    }

    // admin can only switch between user and admin
    return [
      { value: 'user' as UserRole, label: '普通用户' },
      { value: 'admin' as UserRole, label: '管理员' },
    ];
  };

  /** 是否可以重置密码/删除 */
  const canOperate = (targetUser: UserManageVO) => {
    if (!currentUser) return false;
    if (targetUser.id === currentUser.id) return false;
    if (targetUser.role === 'root') return false;
    if (currentUser.role === 'admin' && targetUser.role === 'admin') return false;
    return true;
  };

  const columns: ColumnsType<UserManageVO> = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (val: string | null) => val ?? <Tag>未设置</Tag>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRole, record: UserManageVO) => {
        const options = getRoleOptions(record);
        if (options.length === 0) {
          return <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>;
        }
        return (
          <Select
            size="small"
            value={role}
            style={{ width: 120 }}
            options={options}
            onChange={(newRole: UserRole) => handleRoleChange(record.id, newRole)}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? 'default'}>
          {STATUS_LABELS[status] ?? status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val: string | null) => {
        if (!val) return '-';
        const d = new Date(val);
        return d.toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: UserManageVO) => (
        <Space>
          {canOperate(record) && (
            <Popconfirm
              title="确认重置该用户的密码？"
              description="密码将重置为 123456"
              onConfirm={() => handleResetPassword(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" type="link">重置密码</Button>
            </Popconfirm>
          )}
          {canOperate(record) && (
            <Popconfirm
              title="确认删除该用户？"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" type="link" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            创建用户
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <Modal
        title="创建用户"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入用户邮箱" />
          </Form.Item>
          <p style={{ color: '#999', fontSize: 12 }}>
            创建后初始密码为 123456，用户首次登录时需要设置用户名和密码
          </p>
        </Form>
      </Modal>
    </div>
  );
}
