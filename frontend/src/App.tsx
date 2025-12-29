import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import RecycleBin from './pages/Dashboard/RecycleBin';
import Favorites from './pages/Dashboard/Favorites';
import ShareView from './pages/Share/ShareView';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Profile from './pages/User/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfigProvider, theme } from 'antd';
import { useThemeStore } from './store/useThemeStore';

function App() {
  const { isDarkMode } = useThemeStore();

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/recycle",
      element: (
        <ProtectedRoute>
          <RecycleBin />
        </ProtectedRoute>
      ),
    },
    {
      path: "/favorites",
      element: (
        <ProtectedRoute>
          <Favorites />
        </ProtectedRoute>
      ),
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/share/:token",
      element: <ShareView />,
    },
    {
      path: "/profile",
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin",
      element: (
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      ),
    },
  ]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ffafcc',
          borderRadius: 12,
          fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
