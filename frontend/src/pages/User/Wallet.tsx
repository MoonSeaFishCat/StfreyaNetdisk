import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button, Statistic, Row, Col, Modal, InputNumber } from 'antd';
import { 
  WalletOutlined, 
  HistoryOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';
import { useAuthStore } from '../../store';
import antdGlobal from '../../utils/antd';

const { Title, Text } = Typography;

const Wallet: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeGB, setExchangeGB] = useState(1);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/user/transactions');
      setTransactions(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const res: any = await request.post('/user/invite/generate');
      antdGlobal.message.success(`成功生成邀请码: ${res.code}`);
      // 刷新用户信息和交易记录
      const userRes: any = await request.get('/user/info');
      setUser(userRes.user);
      fetchTransactions();
    } catch (err: any) {
      antdGlobal.message.error(err.response?.data?.error || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleExchangeQuota = async () => {
    setExchanging(true);
    try {
      await request.post('/user/exchange/quota', { gb: exchangeGB });
      antdGlobal.message.success(`成功兑换 ${exchangeGB}GB 存储空间`);
      setIsExchangeModalOpen(false);
      // 刷新用户信息和交易记录
      const userRes: any = await request.get('/user/info');
      setUser(userRes.user);
      fetchTransactions();
    } catch (err: any) {
      antdGlobal.message.error(err.response?.data?.error || '兑换失败');
    } finally {
      setExchanging(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const columns = [
    {
      title: '类型',
      dataIndex: 'Type',
      key: 'Type',
      render: (type: string) => {
        const types: any = {
          'signin': { color: 'green', text: '每日签到', icon: <GiftOutlined /> },
          'invite': { color: 'orange', text: '生成邀请码', icon: <SafetyCertificateOutlined /> },
          'reward': { color: 'blue', text: '系统奖励', icon: <ArrowUpOutlined /> },
          'consume': { color: 'red', text: '消费支出', icon: <ArrowDownOutlined /> },
        };
        const config = types[type] || { color: 'default', text: type };
        return (
          <Tag color={config.color} className="flex items-center w-fit gap-1">
            {config.icon}
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '变动金额',
      dataIndex: 'Amount',
      key: 'Amount',
      render: (amount: number) => (
        <span className={`font-bold ${amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {amount > 0 ? `+${amount}` : amount}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'Remark',
      key: 'Remark',
      render: (remark: string) => <span className="text-slate-500 dark:text-slate-400">{remark}</span>,
    },
    {
      title: '时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (time: string) => <span className="text-slate-400">{new Date(time).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stfreya-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50">
          <WalletOutlined />
        </div>
        <div>
          <Title level={2} className="!mb-0 dark:!text-slate-100">我的钱包</Title>
          <Text className="text-slate-400">管理您的学园币与邀请码</Text>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
            <Statistic
              title={<span className="dark:text-slate-400">当前余额 (学园币)</span>}
              value={user?.coin || 0}
              prefix={<WalletOutlined className="text-stfreya-500" />}
              styles={{ content: { color: '#ff336b', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 h-full flex items-center">
            <div className="flex justify-between items-center w-full">
              <div>
                <Title level={4} className="!mb-1 dark:!text-slate-200">生成邀请码</Title>
                <Text className="text-slate-400">消耗 10 币生成永久码</Text>
              </div>
              <Button 
                type="primary" 
                icon={<SafetyCertificateOutlined />} 
                onClick={handleGenerateInvite}
                loading={generating}
                className="h-10 !rounded-xl"
              >
                生成
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 h-full flex items-center">
            <div className="flex justify-between items-center w-full">
              <div>
                <Title level={4} className="!mb-1 dark:!text-slate-200">兑换空间</Title>
                <Text className="text-slate-400">10 币 = 1GB 永久空间</Text>
              </div>
              <Button 
                type="primary" 
                ghost
                onClick={() => setIsExchangeModalOpen(true)}
                className="h-10 !rounded-xl border-stfreya-500 text-stfreya-500 hover:text-stfreya-600 hover:border-stfreya-600"
              >
                兑换
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={<span className="dark:text-slate-200">兑换存储空间</span>}
        open={isExchangeModalOpen}
        onCancel={() => setIsExchangeModalOpen(false)}
        onOk={handleExchangeQuota}
        confirmLoading={exchanging}
        okText="立即兑换"
        cancelText="取消"
        className="dark:modal-dark"
      >
        <div className="py-4 space-y-4">
          <p className="text-slate-500 dark:text-slate-400">请输入您要兑换的容量 (GB):</p>
          <InputNumber
            min={1}
            max={100}
            value={exchangeGB}
            onChange={(val) => setExchangeGB(val || 1)}
            className="w-full h-12 !rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
          />
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
            <p className="text-amber-700 dark:text-amber-400 text-sm mb-0">
              提示：本次兑换将消耗 <span className="font-bold">{exchangeGB * 10}</span> 学园币。
            </p>
          </div>
        </div>
      </Modal>

      <Card 
        className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50"
        title={
          <div className="flex items-center gap-2 py-2">
            <HistoryOutlined className="text-slate-400" />
            <span className="dark:text-slate-200">收支明细</span>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="ID"
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="dark:ant-table-dark"
        />
      </Card>
    </div>
  );
};

export default Wallet;
