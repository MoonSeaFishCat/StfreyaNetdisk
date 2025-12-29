import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Modal, Input, message } from 'antd';
import request from '../../utils/request';
import { formatBytes } from '../../utils/format';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newQuota, setNewQuota] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateQuota = async () => {
    try {
      const quota = parseInt(newQuota) * 1024 * 1024 * 1024; // GB to bytes
      await request.post('/admin/user/quota', {
        userId: selectedUser.ID,
        totalSize: quota
      });
      message.success('配额更新成功');
      setQuotaModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'ID', key: 'ID' },
    { title: '用户名', dataIndex: 'Username', key: 'Username' },
    { title: '邮箱', dataIndex: 'Email', key: 'Email' },
    { title: '角色', dataIndex: 'Role', key: 'Role' },
    { 
      title: '已用空间', 
      dataIndex: 'UsedSize', 
      key: 'UsedSize',
      render: (size: number) => formatBytes(size)
    },
    { 
      title: '总空间', 
      dataIndex: 'TotalSize', 
      key: 'TotalSize',
      render: (quota: number) => formatBytes(quota)
    },
    { title: '学园币', dataIndex: 'Coin', key: 'Coin' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setSelectedUser(record);
              setNewQuota((record.TotalSize / (1024 * 1024 * 1024)).toString());
              setQuotaModalVisible(true);
            }}
          >
            调整配额
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table 
        columns={columns} 
        dataSource={users} 
        loading={loading} 
        rowKey="ID"
        className="萌系表格"
      />

      <Modal
        title={`调整用户 ${selectedUser?.Username} 的空间配额`}
        open={quotaModalVisible}
        onOk={handleUpdateQuota}
        onCancel={() => setQuotaModalVisible(false)}
        okText="保存"
        cancelText="取消"
        className="萌系圆角"
      >
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">空间配额 (GB):</div>
          <Input 
            type="number" 
            value={newQuota} 
            onChange={(e) => setNewQuota(e.target.value)}
            className="萌系圆角"
          />
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
