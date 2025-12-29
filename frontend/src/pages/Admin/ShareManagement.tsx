import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tag, Typography } from 'antd';
import { DeleteOutlined, ShareAltOutlined } from '@ant-design/icons';
import request from '../../utils/request';

const { Text } = Typography;

const ShareManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const res: any = await request.get('/admin/shares');
      setData(res.data || []);
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认强制取消该分享?',
      content: '此操作将使分享链接立即失效。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await request.delete(`/admin/share/${id}`);
          message.success('分享已取消');
          fetchShares();
        } catch (error) {}
      }
    });
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '分享者',
      dataIndex: 'username',
      key: 'username',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '提取码',
      dataIndex: 'Password',
      key: 'Password',
      render: (pw: string) => pw || <Text type="secondary">公开</Text>,
    },
    {
      title: '访问/下载',
      key: 'stats',
      render: (_: any, record: any) => (
        <Text type="secondary">{record.Views} / {record.Downloads}</Text>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'ExpireTime',
      key: 'ExpireTime',
      render: (time: string) => time ? new Date(time).toLocaleString() : '永久有效',
    },
    {
      title: '创建时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDelete(record.ID)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ShareAltOutlined className="text-stfreya-pink" />
          全站分享管理
        </h3>
        <Button onClick={fetchShares} loading={loading}>刷新</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        rowKey="ID"
        pagination={{ pageSize: 10 }}
        className="萌系圆角 overflow-hidden border border-gray-100"
      />
    </div>
  );
};

export default ShareManagement;
