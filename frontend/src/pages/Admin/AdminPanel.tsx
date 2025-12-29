import React from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, Card } from 'antd';
import UserManagement from './UserManagement';
import PolicyManagement from './PolicyManagement';
import AdminDashboardStats from './AdminDashboardStats';
import SystemSettings from './SystemSettings';
import ShareManagement from './ShareManagement';
import InviteManagement from './InviteManagement';
import { UserOutlined, SettingOutlined, DashboardOutlined, ToolOutlined, ShareAltOutlined, KeyOutlined } from '@ant-design/icons';

const AdminPanel: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stfreya-pink">管理面板</h1>
        </div>
        <Card className="萌系圆角 shadow-xl border-none">
          <Tabs
            defaultActiveKey="dashboard"
            items={[
              {
                key: 'dashboard',
                label: (
                  <span>
                    <DashboardOutlined />
                    概览
                  </span>
                ),
                children: <AdminDashboardStats />,
              },
              {
                key: 'users',
                label: (
                  <span>
                    <UserOutlined />
                    用户管理
                  </span>
                ),
                children: <UserManagement />,
              },
              {
                key: 'shares',
                label: (
                  <span>
                    <ShareAltOutlined />
                    分享管理
                  </span>
                ),
                children: <ShareManagement />,
              },
              {
                key: 'invites',
                label: (
                  <span>
                    <KeyOutlined />
                    邀请码
                  </span>
                ),
                children: <InviteManagement />,
              },
              {
                key: 'policies',
                label: (
                  <span>
                    <SettingOutlined />
                    存储策略
                  </span>
                ),
                children: <PolicyManagement />,
              },
              {
                key: 'settings',
                label: (
                  <span>
                    <ToolOutlined />
                    系统设置
                  </span>
                ),
                children: <SystemSettings />,
              },
            ]}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
