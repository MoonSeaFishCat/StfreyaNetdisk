import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useConfigStore, useAuthStore } from './store';
import request from './utils/request';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import StoragePolicies from './pages/admin/StoragePolicies';
import StoragePolicyConfig from './pages/admin/StoragePolicyConfig';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SiteSettings from './pages/admin/SiteSettings';
import InvitationManagement from './pages/admin/InvitationManagement';
import FileList from './pages/user/FileList';
import Favorites from './pages/user/Favorites';
import Shares from './pages/user/Shares';
import Wallet from './pages/user/Wallet';
import Profile from './pages/user/Profile';
import Messages from './pages/user/Messages';
import RecycleBin from './pages/user/RecycleBin';
import ShareView from './pages/ShareView';
import AllShares from './pages/admin/AllShares';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

import AntdGlobal from './components/AntdGlobal';

const MainApp: React.FC = () => {
  const { themeMode } = useConfigStore();
  const { token, setUser, clearAuth } = useAuthStore();
  const isDark = themeMode === 'dark';

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res: any = await request.get('/user/info');
          setUser(res.user);
        } catch (err) {
          console.error('Failed to fetch user info:', err);
          // 如果获取失败且是 401，clearAuth 会在 request.ts 中处理
        }
      }
    };
    initAuth();
  }, [token, setUser]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ff336b',
          borderRadius: 12,
          colorBgContainer: isDark ? '#1a1a1a' : '#ffffff',
          colorBgLayout: isDark ? '#0f0f0f' : '#fff5f7',
          colorTextBase: isDark ? '#e2e8f0' : '#1e293b',
          colorBorder: isDark ? '#2d2d2d' : '#f1f5f9',
          colorBgElevated: isDark ? '#242424' : '#ffffff',
        },
        components: {
          Button: {
            borderRadius: 10,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 10,
            controlHeight: 40,
          },
          Card: {
            borderRadiusLG: 20,
          },
          Modal: {
            colorBgElevated: isDark ? '#1f1f1f' : '#ffffff',
            borderRadiusLG: 24,
          },
          Select: {
            borderRadius: 10,
            controlHeight: 40,
            colorBgElevated: isDark ? '#262626' : '#ffffff',
          },
          Table: {
            colorBgContainer: isDark ? 'transparent' : '#ffffff',
          }
        }
      }}
    >
      <App>
        <AntdGlobal />
        <BrowserRouter>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
              <Route index element={<FileList />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="shares" element={<Shares />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<Profile />} />
              <Route path="messages" element={<Messages />} />
              <Route path="recycle" element={<RecycleBin />} />
              <Route path="s/:token" element={<ShareView />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="policies" element={<StoragePolicies />} />
              <Route path="policies/new" element={<StoragePolicyConfig />} />
              <Route path="policies/edit/:id" element={<StoragePolicyConfig />} />
              <Route path="shares" element={<AllShares />} />
              <Route path="invitations" element={<InvitationManagement />} />
              <Route path="settings" element={<SiteSettings />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </App>
    </ConfigProvider>
  );
};

export default MainApp;
