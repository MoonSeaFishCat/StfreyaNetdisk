import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Space, Modal, Form, InputNumber, Avatar, Select } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, TransactionOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/users');
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (values: any) => {
    try {
      // 同时更新配额和用户信息
      await request.post('/admin/user/quota', {
        userId: editingUser.ID,
        totalSize: values.totalSize * 1024 * 1024 * 1024,
      });

      await request.put('/admin/user/update', {
        userId: editingUser.ID,
        role: values.role,
        status: values.status,
        coin: values.coin,
      });

      antdGlobal.message.success('更新用户信息成功');
      setIsModalVisible(false);
      fetchUsers();
    } catch (err) {
      antdGlobal.message.error('更新失败');
    }
  };

  const handleDelete = (id: number) => {
    antdGlobal.modal.confirm({
      title: '删除用户',
      content: '确定要删除此用户吗？此操作不可撤销，且会删除该用户的所有文件。',
      okType: 'danger',
      onOk: async () => {
        try {
          await request.delete(`/admin/user/${id}`);
          antdGlobal.message.success('用户已删除');
          fetchUsers();
        } catch (err) {
          antdGlobal.message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: <span className="dark:text-slate-300">用户</span>,
      dataIndex: 'Username',
      key: 'Username',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={record.Avatar || undefined} 
            icon={<UserOutlined />} 
            className="bg-stfreya-100 dark:bg-stfreya-900/30 text-stfreya-500" 
          />
          <div>
            <div className="font-medium text-slate-700 dark:text-slate-200">{text}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{record.Email}</div>
          </div>
        </div>
      ),
    },
    {
      title: <span className="dark:text-slate-300">角色</span>,
      dataIndex: 'Role',
      key: 'Role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'purple' : 'blue'} className="dark:border-none">
          {(role || 'user').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: <span className="dark:text-slate-300">空间使用</span>,
      key: 'usage',
      render: (_: any, record: any) => (
        <div>
          <div className="text-xs mb-1 dark:text-slate-400">
            {((record.UsedSize || 0) / 1024 / 1024 / 1024).toFixed(2)} GB / {((record.TotalSize || 0) / 1024 / 1024 / 1024).toFixed(0)} GB
          </div>
          <div className="w-32 h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-stfreya-300 dark:bg-stfreya-500" 
              style={{ width: `${Math.min(100, ((record.UsedSize || 0) / (record.TotalSize || 1)) * 100)}%` }} 
            />
          </div>
        </div>
      ),
    },
    {
      title: <span className="dark:text-slate-300">学园币</span>,
      dataIndex: 'Coin',
      key: 'Coin',
      render: (coin: number) => (
        <div className="flex items-center gap-1 font-bold text-stfreya-500">
          <TransactionOutlined />
          {coin || 0}
        </div>
      ),
    },
    {
      title: <span className="dark:text-slate-300">状态</span>,
      dataIndex: 'Status',
      key: 'Status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'} className="dark:border-none">
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: <span className="dark:text-slate-300">操作</span>,
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined className="dark:text-slate-400" />} 
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue({ 
                totalSize: record.TotalSize / 1024 / 1024 / 1024,
                role: record.Role,
                status: record.Status,
                coin: record.Coin
              });
              setIsModalVisible(true);
            }} 
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.ID)}
            disabled={record.Role === 'admin'}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">用户管理</h2>
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="ID" 
          loading={loading}
          className="dark:ant-table-dark"
          pagination={{
            className: "dark:text-slate-400"
          }}
        />
      </Card>

      <Modal
        title={<span className="dark:text-slate-200">编辑用户信息 - {editingUser?.username}</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        className="dark:modal-dark"
        width={500}
      >
        <Form form={form} onFinish={handleUpdateUser} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="role" 
              label={<span className="dark:text-slate-300">用户角色</span>} 
              rules={[{ required: true }]}
            >
              <Select className="dark:ant-select-dark">
                <Select.Option value="user">普通用户</Select.Option>
                <Select.Option value="admin">管理员</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item 
              name="status" 
              label={<span className="dark:text-slate-300">账户状态</span>} 
              rules={[{ required: true }]}
            >
              <Select className="dark:ant-select-dark">
                <Select.Option value={1}>正常</Select.Option>
                <Select.Option value={0}>禁用</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item 
            name="totalSize" 
            label={<span className="dark:text-slate-300">总存储空间 (GB)</span>} 
            rules={[{ required: true }]}
          >
            <InputNumber min={1} className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>

          <Form.Item 
            name="coin" 
            label={<span className="dark:text-slate-300">学园币余额</span>} 
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
