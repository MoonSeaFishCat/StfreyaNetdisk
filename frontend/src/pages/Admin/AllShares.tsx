import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Card, Tag, Avatar } from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  CopyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const AllShares: React.FC = () => {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchAllShares = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/shares');
      setShares(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取全站分享列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllShares();
  }, []);

  const handleDelete = (id: number) => {
    antdGlobal.modal.confirm({
      title: '强制取消分享',
      content: '作为管理员，你可以取消全站任何分享。确定要取消这个分享吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.delete(`/admin/share/${id}`);
          antdGlobal.message.success('已取消分享');
          fetchAllShares();
        } catch (err) {
          antdGlobal.message.error('操作失败');
        }
      },
    });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    antdGlobal.message.success('链接已复制到剪贴板');
  };

  const filteredShares = shares.filter(s => 
    s.fileName.toLowerCase().includes(searchText.toLowerCase()) ||
    s.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '分享者',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" src={record.avatar || undefined} icon={<UserOutlined />} />
          <span className="text-sm text-slate-600 dark:text-slate-300">{text}</span>
        </div>
      ),
    },
    {
      title: '分享文件',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 dark:text-slate-200">{text}</span>
          <span className="text-[10px] text-slate-400">
            {record.fileSize ? (record.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '-'}
          </span>
        </div>
      ),
    },
    {
      title: '提取码',
      dataIndex: 'password',
      key: 'password',
      render: (pwd: string) => pwd ? <Tag color="blue">{pwd}</Tag> : <Tag>无</Tag>,
    },
    {
      title: '到期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
      render: (time: string) => {
        if (!time) return <Tag color="green">永久有效</Tag>;
        const date = new Date(time);
        const isExpired = date < new Date();
        return <Tag color={isExpired ? 'red' : 'orange'}>{date.toLocaleString()}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => copyLink(record.token)}
            title="复制链接"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.ID)}
            title="强制取消"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800 transition-colors">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 m-0">全站分享管理</h2>
        <Input
          prefix={<SearchOutlined className="text-slate-300" />}
          placeholder="搜索文件名或分享者..."
          className="w-64 !rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredShares}
          rowKey="ID"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="dark:ant-table-dark"
        />
      </Card>

      {filteredShares.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-800 rounded-3xl shadow-sm transition-colors">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=admin-share" alt="empty" className="w-32 h-32 opacity-20 mb-4" />
          <p className="text-slate-400">全站暂无分享 ~</p>
        </div>
      )}
    </div>
  );
};

export default AllShares;
