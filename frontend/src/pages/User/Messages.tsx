import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, Tooltip, Badge } from 'antd';
import {
  BellOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import request from '../../utils/request';
import dayjs from 'dayjs';
import antdGlobal from '../../utils/antd';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/user/messages');
      setMessages(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取消息列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await request.post(`/user/messages/read/${id}`);
      fetchMessages();
    } catch (err) {
      antdGlobal.message.error('操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await request.post('/user/messages/read/all');
      antdGlobal.message.success('已全部标记为已读');
      fetchMessages();
    } catch (err) {
      antdGlobal.message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/user/messages/${id}`);
      antdGlobal.message.success('删除成功');
      fetchMessages();
    } catch (err) {
      antdGlobal.message.error('删除失败');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleOutlined className="text-green-500" />;
      case 'warning': return <ExclamationCircleOutlined className="text-amber-500" />;
      case 'error': return <ExclamationCircleOutlined className="text-red-500" />;
      default: return <InfoCircleOutlined className="text-blue-500" />;
    }
  };

  const columns = [
    {
      title: '状态',
      dataIndex: 'is_read',
      key: 'is_read',
      width: 80,
      render: (isRead: boolean) => (
        isRead ? 
          <Tag color="default" className="rounded-full">已读</Tag> : 
          <Badge status="processing" text={<Tag color="processing" className="rounded-full">未读</Tag>} />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 60,
      render: (type: string) => getTypeIcon(type),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <span className={record.is_read ? 'text-slate-400 dark:text-slate-500' : 'font-semibold text-slate-700 dark:text-slate-200'}>
          {text}
        </span>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (text: string, record: any) => (
        <span className={record.is_read ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}>
          {text}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      width: 180,
      render: (time: string) => (
        <span className="text-slate-400 text-xs">
          <ClockCircleOutlined className="mr-1" />
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          {!record.is_read && (
            <Tooltip title="标记已读">
              <Button 
                type="text" 
                size="small"
                icon={<MailOutlined />} 
                onClick={() => handleMarkRead(record.ID)}
                className="text-blue-500 hover:text-blue-600"
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button 
              type="text" 
              size="small"
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.ID)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stfreya-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50">
            <BellOutlined />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 m-0">消息中心</h2>
            <p className="text-xs text-slate-400 m-0">查看您的系统通知与奖励提醒</p>
          </div>
        </div>
        <Button 
          icon={<CheckCircleOutlined />} 
          onClick={handleMarkAllRead}
          disabled={messages.filter(m => !m.is_read).length === 0}
          className="!rounded-xl border-stfreya-200 dark:border-neutral-700 dark:text-slate-300 dark:hover:text-stfreya-400"
        >
          全部已读
        </Button>
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 overflow-hidden">
        <Table
          columns={columns}
          dataSource={messages}
          rowKey="ID"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="dark:ant-table-dark"
        />
      </Card>

      {messages.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-neutral-900/30 rounded-3xl shadow-sm backdrop-blur-sm"
        >
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=mail&backgroundColor=transparent" alt="empty" className="w-32 h-32 opacity-20 mb-4" />
          <p className="text-slate-400 dark:text-slate-500">暂时没有新消息 ~</p>
        </motion.div>
      )}
    </div>
  );
};

export default Messages;
