import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, List, Typography, Badge, Progress } from 'antd';
import { UserOutlined, FileOutlined, CloudServerOutlined, ShareAltOutlined, InfoCircleOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import { formatBytes } from '../../utils/format';

const { Text } = Typography;

const AdminDashboardStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res: any = await request.get('/admin/stats');
      setStats(res);
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  }

  const logs = [
    { time: '2025-12-29 16:30', action: '管理员 admin 登录了系统', type: 'info' },
    { time: '2025-12-29 15:45', action: '用户 test 注册成功', type: 'success' },
    { time: '2025-12-29 14:20', action: '系统自动备份完成', type: 'processing' },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={24}>
        <Col span={6}>
          <Card className="萌系圆角 shadow-sm border-none bg-stfreya-pink/5">
            <Statistic 
              title="总用户数" 
              value={stats?.userCount} 
              prefix={<UserOutlined className="text-stfreya-pink" />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="萌系圆角 shadow-sm border-none bg-stfreya-blue/5">
            <Statistic 
              title="总文件数" 
              value={stats?.fileCount} 
              prefix={<FileOutlined className="text-stfreya-blue" />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="萌系圆角 shadow-sm border-none bg-purple-50">
            <Statistic 
              title="存储占用" 
              value={formatBytes(stats?.totalStorage || 0)} 
              prefix={<CloudServerOutlined className="text-purple-400" />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="萌系圆角 shadow-sm border-none bg-orange-50">
            <Statistic 
              title="活跃分享" 
              value={stats?.shareCount} 
              prefix={<ShareAltOutlined className="text-orange-400" />} 
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={16}>
          <Card className="萌系圆角 shadow-xl border-none" title={<><InfoCircleOutlined className="mr-2" />最近系统动态</>}>
            <List
              itemLayout="horizontal"
              dataSource={logs}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Badge status={item.type as any} text={item.action} />}
                    description={<Text type="secondary" size="small">{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="萌系圆角 shadow-xl border-none" title="系统资源">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>CPU 使用率</Text>
                  <Text strong>12%</Text>
                </div>
                <Progress percent={12} size="small" strokeColor="#ffafcc" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>内存 使用率</Text>
                  <Text strong>45%</Text>
                </div>
                <Progress percent={45} size="small" strokeColor="#a2d2ff" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>磁盘 剩余空间</Text>
                  <Text strong>78%</Text>
                </div>
                <Progress percent={78} size="small" strokeColor="#bde0fe" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Card className="萌系圆角 shadow-xl border-none" title="系统公告">
        <div className="text-gray-500 py-4 text-center">
          暂无公告。作为管理员，您可以在此发布全站公告或监控系统运行状况。
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardStats;
