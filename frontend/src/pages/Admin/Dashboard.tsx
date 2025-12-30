import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Avatar, Tag, Button, Flex, Spin } from 'antd';
import {
  UserOutlined,
  CloudServerOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  DashboardOutlined,
  GiftOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await request.get('/admin/stats');
        setStats(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: '总用户数', value: stats?.userCount || 0, icon: <UserOutlined />, color: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400' },
    { title: '总文件数', value: stats?.fileCount || 0, icon: <FileTextOutlined />, color: 'bg-pink-50 text-pink-500 dark:bg-pink-900/20 dark:text-pink-400' },
    { title: '存储总量', value: `${(stats?.totalStorage / 1024 / 1024 / 1024).toFixed(2)} GB`, icon: <CloudServerOutlined />, color: 'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400' },
    { title: '活跃分享', value: stats?.shareCount || 0, icon: <ShareAltOutlined />, color: 'bg-purple-50 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400' },
    { title: '全站学园币', value: stats?.totalCoins || 0, icon: <WalletOutlined />, color: 'bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400' },
    { title: '邀请码总数', value: stats?.invitationCount || 0, icon: <GiftOutlined />, color: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stfreya-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50">
          <DashboardOutlined />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">系统概览</h2>
          <p className="text-slate-400 dark:text-slate-500">欢迎回来，管理员。这是今天的系统运行状况。</p>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:scale-105 transition-all !rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${card.color}`}>
                    {card.icon}
                  </div>
                  <Statistic 
                    title={<span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.title}</span>} 
                    value={card.value} 
                    styles={{ content: { color: 'inherit', fontWeight: 'bold', fontSize: '1.25rem' } }}
                    className="dark:text-slate-100"
                  />
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card 
            title={<span className="dark:text-slate-200">最近上传文件</span>} 
            className="h-full !rounded-3xl border-none shadow-sm dark:bg-neutral-900/50"
          >
            {loading ? (
              <div className="py-12 flex justify-center"><Spin /></div>
            ) : (
              <Flex vertical gap={0}>
                {(stats?.recentFiles || []).map((file: any, index: number) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between py-4 ${
                      index !== (stats?.recentFiles?.length - 1) ? 'border-b border-slate-50 dark:border-neutral-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stfreya-50 dark:bg-stfreya-900/20 rounded-lg flex items-center justify-center text-stfreya-500">
                        <FileTextOutlined />
                      </div>
                      <div>
                        <div className="dark:text-slate-200 font-medium">{file.Name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{file.username} 上传</span>
                          <span>•</span>
                          <span>{(file.Size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(file.CreatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {(!stats?.recentFiles || stats.recentFiles.length === 0) && (
                  <div className="py-12 text-center text-slate-400">暂无上传记录</div>
                )}
              </Flex>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<span className="dark:text-slate-200">最近注册用户</span>}
            className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50"
          >
            {loading ? (
              <div className="py-12 flex justify-center"><Spin /></div>
            ) : (
              <Flex vertical gap={0}>
                {(stats?.recentUsers || []).map((user: any, index: number) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between py-4 ${
                      index !== (stats?.recentUsers?.length - 1) ? 'border-b border-slate-50 dark:border-neutral-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={user.avatar || undefined} 
                        icon={<UserOutlined />} 
                        className="bg-slate-100 dark:bg-neutral-800" 
                      />
                      <div>
                        <div className="dark:text-slate-200 font-medium">{user.username}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(user.CreatedAt).toLocaleString()} 注册
                        </div>
                      </div>
                    </div>
                    <Tag color={user.status === 1 ? 'green' : 'red'} className="dark:border-none">
                      {user.status === 1 ? '正常' : '禁用'}
                    </Tag>
                  </div>
                ))}
                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                  <div className="py-12 text-center text-slate-400">暂无注册用户</div>
                )}
              </Flex>
            )}
            <div className="text-center mt-4">
              <Button type="link" onClick={() => navigate('/admin/users')} className="text-stfreya-500">查看全部用户</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
