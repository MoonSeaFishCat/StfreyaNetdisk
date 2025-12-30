import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ShareAltOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  CloudOutlined,
  TeamOutlined,
  BulbOutlined,
  BulbFilled,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Header, Sider, Content } = Layout;

import { useAuthStore, useConfigStore } from '../store';
import antdGlobal from '../utils/antd';

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { themeMode, toggleTheme } = useConfigStore();
  const isDark = themeMode === 'dark';

  const handleLogout = () => {
    clearAuth();
    antdGlobal.message.success('已退出管理员模式');
    navigate('/login');
  };

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/admin/policies', icon: <DatabaseOutlined />, label: '存储策略' },
    { key: '/admin/shares', icon: <ShareAltOutlined />, label: '全站分享' },
    { key: '/admin/invitations', icon: <SafetyCertificateOutlined />, label: '邀请码管理' },
    { key: '/admin/settings', icon: <SettingOutlined />, label: '站点配置' },
  ];

  const userMenu = {
    items: [
      { key: 'user-center', icon: <CloudOutlined />, label: '返回用户中心' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'user-center') navigate('/');
      if (key === 'logout') handleLogout();
    },
  };

  return (
    <Layout className="min-h-screen bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={isDark ? 'dark' : 'light'}
        className="border-r border-slate-200 dark:border-neutral-800 sticky top-0 h-screen !bg-white/70 dark:!bg-neutral-900/40 backdrop-blur-md"
        width={240}
      >
        <div className="h-16 flex items-center justify-center p-4">
          <div className="text-stfreya-600 font-bold text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 dark:bg-stfreya-500 rounded-lg flex items-center justify-center text-white">
              A
            </div>
            {!collapsed && <span className="text-slate-800 dark:text-slate-200">Admin Panel</span>}
          </div>
        </div>
        <Menu
          mode="inline"
          theme={isDark ? 'dark' : 'light'}
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="px-2 border-none"
        />
      </Sider>
      
      <Layout className="!bg-transparent">
        <Header className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 px-6 flex items-center justify-between sticky top-0 z-10 h-16">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 dark:text-slate-300"
          />
          
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={isDark ? <BulbFilled className="text-amber-400" /> : <BulbOutlined />}
              onClick={toggleTheme}
              className="text-slate-400 dark:text-slate-300"
            />
            
            <Dropdown menu={userMenu}>
              <div className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                <Avatar 
                  src={user?.avatar || undefined} 
                  icon={<UserOutlined />} 
                  className="bg-slate-800 dark:bg-stfreya-500"
                />
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {user?.username}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    系统管理员
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
