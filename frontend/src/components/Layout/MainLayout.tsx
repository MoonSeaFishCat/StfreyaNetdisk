import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, ConfigProvider, theme, Dropdown, Modal, Input } from 'antd';
import {
  FolderOpenOutlined,
  DeleteOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  CrownOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../../store/useThemeStore';
import { useUserStore } from '../../store/useUserStore';
import { useConfigStore } from '../../store/useConfigStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request';
import { message } from 'antd';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { user, token, setUser, logout } = useUserStore();
  const { fetchPublicConfigs } = useConfigStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicConfigs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSignIn = async () => {
    try {
      const res: any = await request.post('/user/signin');
      message.success(res.message);
      // 刷新用户信息以更新学园币
      const userRes: any = await request.get('/user/info');
      if (token) {
        setUser(userRes.user, token);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '签到失败');
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const res: any = await request.post('/user/invite/generate');
      Modal.success({
        title: '邀请码生成成功',
        content: (
          <div className="mt-4">
            <div className="text-gray-500 mb-2">邀请码已生成，已消耗 10 学园币：</div>
            <Input value={res.code} readOnly className="萌系圆角" />
          </div>
        ),
        okText: '复制',
        onOk: () => {
          navigator.clipboard.writeText(res.code);
          message.success('已复制到剪贴板');
        }
      });
      // 刷新用户信息以更新学园币
      const userRes: any = await request.get('/user/info');
      if (token) {
        setUser(userRes.user, token);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '生成失败');
    }
  };

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'all':
        navigate('/');
        break;
      case 'favorites':
        navigate('/favorites');
        break;
      case 'trash':
        navigate('/recycle');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        break;
    }
  };

  const menuItems: any[] = [
    {
      key: 'all',
      icon: <FolderOpenOutlined />,
      label: '全部文件',
    },
    {
      key: 'favorites',
      icon: <StarOutlined />,
      label: '我的收藏',
    },
    {
      key: 'trash',
      icon: <DeleteOutlined />,
      label: '回收站',
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ key: 'admin', icon: <CrownOutlined />, label: '管理面板' });
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ffafcc', // 樱花粉
          borderRadius: 12, // 萌系圆角
          fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
        },
      }}
    >
      <Layout className="min-h-screen">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme={isDarkMode ? 'dark' : 'light'}
          className="萌系圆角 m-3 shadow-lg overflow-hidden transition-all duration-300"
          style={{ height: 'calc(100vh - 24px)' }}
        >
          <div className="p-4 text-center">
            <motion.div
              animate={{ scale: collapsed ? 0.8 : 1 }}
              className="text-stfreya-pink text-xl font-bold truncate"
            >
              {collapsed ? 'S' : 'StfreyaNet'}
            </motion.div>
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['all']}
            items={menuItems}
            className="border-none"
            onClick={({ key }) => handleMenuClick(key)}
          />
          <div className="absolute bottom-4 left-0 w-full px-4">
             <div className="bg-stfreya-pink/10 p-3 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">已用空间</div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-stfreya-pink" style={{ width: '45%' }}></div>
                </div>
                <div className="text-[10px] mt-1 text-gray-500">4.5GB / 10GB</div>
             </div>
          </div>
        </Sider>
        <Layout className="bg-transparent">
          <Header className="bg-white/80 dark:bg-stfreya-dark/80 backdrop-blur-md m-3 rounded-2xl flex items-center justify-between px-6 shadow-sm border border-white/20">
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={collapsed ? <FolderOpenOutlined /> : <FolderOpenOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="hover:text-stfreya-pink"
              />
              <div className="text-lg font-medium text-gray-700 dark:text-gray-200">我的文件</div>
            </div>
            <div className="flex items-center gap-4">
                <Button 
                  type="primary" 
                  size="small" 
                  className="萌系圆角 bg-stfreya-pink border-none text-[10px]"
                  onClick={handleSignIn}
                >
                  签到
                </Button>
                <Button 
                  type="default" 
                  size="small" 
                  className="萌系圆角 border-stfreya-blue text-stfreya-blue text-[10px]"
                  onClick={handleGenerateInvite}
                >
                  生成邀请码
                </Button>
                <div className="flex items-center bg-stfreya-blue/10 px-3 py-1 rounded-full text-stfreya-blue text-sm font-medium">
                  学园币: {user?.coin || 0}
                </div>
              <Button
                type="text"
                icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleDarkMode}
                className="hover:text-stfreya-pink"
              />
              <Dropdown
                menu={{
                  items: [
                    { key: 'profile', label: '个人资料', icon: <UserOutlined />, onClick: () => navigate('/profile') },
                    { key: 'logout', label: '退出登录', icon: <DeleteOutlined />, danger: true, onClick: handleLogout },
                  ],
                }}
              >
                <Button type="text" icon={<UserOutlined />} className="hover:text-stfreya-pink" />
              </Dropdown>
            </div>
          </Header>
          <Content className="m-3 p-6 bg-white/50 dark:bg-stfreya-dark/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={isDarkMode ? 'dark' : 'light'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
