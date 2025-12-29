import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Card, Avatar, Typography, Tag, Space, Button, Table, Tabs, Statistic, Row, Col, Progress } from 'antd';
import { UserOutlined, HistoryOutlined, SettingOutlined, TrophyOutlined, CloudServerOutlined, ShareAltOutlined, KeyOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { useUserStore } from '../../store/useUserStore';
import { formatBytes } from '../../utils/format';
import request from '../../utils/request';
import { message, Modal } from 'antd';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [shares, setShares] = useState([]);
  const [invites, setInvites] = useState([]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res: any = await request.get('/user/transactions');
      setTransactions(res.data || []);
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    try {
      const res: any = await request.get('/user/shares');
      setShares(res.data || []);
    } catch (error) {}
  };

  const fetchInvites = async () => {
    try {
      const res: any = await request.get('/user/invite/list');
      setInvites(res.data || []);
    } catch (error) {}
  };

  useEffect(() => {
    fetchTransactions();
    fetchShares();
    fetchInvites();
  }, []);

  const handleDeleteShare = (id: number) => {
    Modal.confirm({
      title: '确认取消分享?',
      content: '取消后分享链接将失效。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.delete(`/user/share/${id}`);
          message.success('分享已取消');
          fetchShares();
        } catch (error) {}
      }
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label}已复制`);
  };

  const transactionColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'income' ? 'success' : 'warning'}>
          {type === 'income' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '数额',
      dataIndex: 'Amount',
      key: 'Amount',
      render: (amount: number) => (
        <span className={amount > 0 ? 'text-green-500' : 'text-orange-500'}>
          {amount > 0 ? '+' : ''}{amount}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'Remark',
      key: 'Remark',
    },
    {
      title: '时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const shareColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '提取码',
      dataIndex: 'Password',
      key: 'Password',
      render: (pw: string) => pw || <Text type="secondary">公开</Text>,
    },
    {
      title: '过期时间',
      dataIndex: 'ExpireTime',
      key: 'ExpireTime',
      render: (time: string) => time ? new Date(time).toLocaleString() : '永久有效',
    },
    {
      title: '访问/下载',
      key: 'stats',
      render: (_: any, record: any) => (
        <Text type="secondary">{record.Views} / {record.Downloads}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => handleCopy(`${window.location.origin}/s/${record.Token}`, '分享链接')}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteShare(record.ID)}
          />
        </Space>
      ),
    },
  ];

  const inviteColumns = [
    {
      title: '邀请码',
      dataIndex: 'Code',
      key: 'Code',
      render: (code: string) => (
        <Space>
          <Text copyable>{code}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'Status',
      render: (status: number, record: any) => (
        status === 1 ? (
          <Tag color="success">已使用 ({record.usedByUsername})</Tag>
        ) : (
          <Tag color="processing">未使用</Tag>
        )
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const usedSize = user?.usedSize || 0;
  const totalSize = user?.totalSize || 0;
  const usagePercent = totalSize > 0 ? Math.round((usedSize / totalSize) * 100) : 0;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Row gutter={24}>
          <Col span={8}>
            <Card className="萌系圆角 shadow-xl border-none text-center h-full">
              <div className="flex flex-col items-center gap-6 w-full py-4">
                <Avatar 
                  size={120} 
                  src={user?.avatar} 
                  icon={<UserOutlined />} 
                  className="border-4 border-stfreya-pink shadow-lg"
                />
                <div>
                  <Title level={3} className="mb-0">{user?.username}</Title>
                  <Text type="secondary">{user?.email}</Text>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Tag color="magenta" className="萌系圆角">{user?.role === 'admin' ? '校董会成员' : '普通学员'}</Tag>
                  <Tag color="cyan" className="萌系圆角">Lv.1 见习学员</Tag>
                </div>
                <div className="bg-stfreya-pink/5 p-4 rounded-2xl w-full">
                  <Statistic 
                    title="当前学园币" 
                    value={user?.coin} 
                    prefix={<TrophyOutlined className="text-stfreya-pink" />}
                  />
                  <Button type="primary" className="萌系圆角 mt-4 w-full">充值学园币</Button>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={16}>
            <div className="space-y-6">
              <Card className="萌系圆角 shadow-xl border-none" title={<><CloudServerOutlined className="mr-2" />存储概览</>}>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Statistic title="已使用容量" value={formatBytes(usedSize)} />
                    <Text type="secondary">总容量: {formatBytes(totalSize)}</Text>
                  </div>
                  <Progress 
                    percent={usagePercent} 
                    strokeColor={{ '0%': '#ffafcc', '100%': '#ffc2d1' }}
                    status="active"
                    strokeWidth={12}
                  />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Card size="small" className="bg-stfreya-pink/5 border-none 萌系圆角">
                      <Statistic title="文件数量" value={user?.fileCount || 0} />
                    </Card>
                    <Card size="small" className="bg-stfreya-blue/5 border-none 萌系圆角">
                      <Statistic title="分享链接" value={shares.length} />
                    </Card>
                    <Card size="small" className="bg-purple-50 border-none 萌系圆角">
                      <Statistic title="未使用邀请码" value={invites.filter((i: any) => i.Status === 0).length} />
                    </Card>
                  </div>
                </div>
              </Card>

              <Card className="萌系圆角 shadow-xl border-none">
                <Tabs 
                  defaultActiveKey="history"
                  items={[
                    {
                      key: 'history',
                      label: <span><HistoryOutlined /> 学园币流水</span>,
                      children: (
                        <Table 
                          dataSource={transactions} 
                          columns={transactionColumns} 
                          loading={loading}
                          pagination={{ pageSize: 5 }}
                          size="small"
                        />
                      ),
                    },
                    {
                      key: 'shares',
                      label: <span><ShareAltOutlined /> 我的分享</span>,
                      children: (
                        <Table 
                          dataSource={shares} 
                          columns={shareColumns} 
                          pagination={{ pageSize: 5 }}
                          size="small"
                        />
                      ),
                    },
                    {
                      key: 'invites',
                      label: <span><KeyOutlined /> 邀请码</span>,
                      children: (
                        <Table 
                          dataSource={invites} 
                          columns={inviteColumns} 
                          pagination={{ pageSize: 5 }}
                          size="small"
                        />
                      ),
                    },
                    {
                      key: 'settings',
                      label: <span><SettingOutlined /> 账号设置</span>,
                      children: (
                        <div className="py-4 space-y-4">
                          <Button block className="萌系圆角">修改密码</Button>
                          <Button block className="萌系圆角">更换头像</Button>
                          <Button block className="萌系圆角 text-red-500">退出登录</Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
};

export default Profile;
