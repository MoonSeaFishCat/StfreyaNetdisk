import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, MenuProps, Badge } from 'antd';
import {
  FileOutlined,
  HeartOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BulbOutlined,
  BulbFilled,
  DashboardOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useConfigStore } from '../store';
import request from '../utils/request';
import antdGlobal from '../utils/antd';

const { Header, Sider, Content } = Layout;

const UserLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { themeMode, toggleTheme } = useConfigStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const isDark = themeMode === 'dark';

  const fetchUnreadCount = async () => {
    try {
      const res: any = await request.get('/user/messages/unread/count');
      setUnreadCount(res.count || 0);
    } catch (err) {
      // 静默失败
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // 每 2 分钟轮询一次未读消息
    const timer = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearAuth();
    antdGlobal.message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <FileOutlined />, label: '我的文件' },
    { key: '/favorites', icon: <HeartOutlined />, label: '我的收藏' },
    { key: '/shares', icon: <ShareAltOutlined />, label: '我的分享' },
    { key: '/messages', icon: <Badge dot={unreadCount > 0} offset={[2, 0]}><BellOutlined /></Badge>, label: '消息中心' },
    { key: '/recycle', icon: <DeleteOutlined />, label: '回收站' },
    { key: '/wallet', icon: <BulbOutlined />, label: '我的积分' },
  ];

  const handleSignIn = async () => {
    try {
      const res: any = await request.post('/user/signin');
      antdGlobal.message.success(`签到成功！获得 ${res.reward} 学园币`);
      // 重新获取用户信息以更新余额
      const userRes: any = await request.get('/user/info');
      useAuthStore.getState().setUser(userRes.user);
    } catch (err: any) {
      antdGlobal.message.error(err.response?.data?.error || '签到失败');
    }
  };

  const usedGB = (user?.usedSize || 0) / (1024 * 1024 * 1024);
  const totalGB = (user?.totalSize || 1) / (1024 * 1024 * 1024);
  const usagePercent = (usedGB / totalGB) * 100;

  const userMenuItems: MenuProps['items'] = [
    ...(user?.role === 'admin' ? [{ key: 'admin', icon: <DashboardOutlined />, label: '管理后台' }, { type: 'divider' as const }] : []),
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const userMenu = {
    items: userMenuItems,
    onClick: ({ key }: { key: string }) => {
      if (key === 'admin') {
        navigate('/admin');
      } else if (key === 'profile') {
        navigate('/profile');
      } else if (key === 'logout') {
        handleLogout();
      }
    },
  };

  return (
    <Layout className="min-h-screen bg-stfreya-50 dark:bg-neutral-950">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={isDark ? 'dark' : 'light'}
        className="border-r border-stfreya-100 dark:border-neutral-800 !bg-white/70 dark:!bg-neutral-900/40 backdrop-blur-md sticky top-0 h-screen"
        width={240}
      >
        <div className="h-16 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-stfreya-500 dark:text-stfreya-400 font-bold text-xl flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-stfreya-500 rounded-lg flex items-center justify-center text-white">
              S
            </div>
            {!collapsed && <span>Stfreya Netdisk</span>}
          </motion.div>
        </div>
        <Menu
          mode="inline"
          theme={isDark ? 'dark' : 'light'}
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="px-2 !bg-transparent border-none"
        />
        
        {!collapsed && (
          <div className="absolute bottom-8 left-0 right-0 px-6 space-y-4">
            <Button 
              type="primary" 
              className="w-full h-10 !rounded-xl bg-stfreya-500 hover:bg-stfreya-600 border-none shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50"
              onClick={handleSignIn}
            >
              每日签到
            </Button>

            <div className="bg-stfreya-100/50 dark:bg-stfreya-900/20 p-4 rounded-2xl">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">存储空间</span>
                <span className="text-stfreya-600 dark:text-stfreya-400 font-bold">{usagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stfreya-300 transition-all duration-500" 
                  style={{ width: `${usagePercent}%` }} 
                />
              </div>
              <p className="text-[10px] text-stfreya-400 mt-2 text-center">
                {usedGB.toFixed(1)}GB / {totalGB.toFixed(0)}GB
              </p>
            </div>
          </div>
        )}
      </Sider>
      
      <Layout className="!bg-transparent dark:bg-neutral-950">
        <Header className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md border-b border-stfreya-100 dark:border-neutral-800 px-6 flex items-center justify-between sticky top-0 z-10 h-16">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg dark:text-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Badge count={unreadCount} overflowCount={99} size="small" offset={[-2, 2]}>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                onClick={() => navigate('/messages')}
                className="dark:text-slate-300"
              />
            </Badge>
            <Button 
              type="text" 
              icon={isDark ? <BulbFilled className="text-amber-400" /> : <BulbOutlined />} 
              onClick={toggleTheme}
              className="dark:text-slate-300"
            />
            
            <Dropdown menu={userMenu} placement="bottomRight" arrow={{ pointAtCenter: true }}>
              <div className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-stfreya-100/50 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                <Avatar 
                  src={user?.avatar || undefined} 
                  icon={<UserOutlined />} 
                  className="bg-stfreya-500 ring-2 ring-stfreya-100 dark:ring-neutral-800"
                />
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {user?.username || '未登录'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {user?.role === 'admin' ? '管理员' : '普通用户'}
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

export default UserLayout;
