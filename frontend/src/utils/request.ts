import axios from 'axios';
import { notification } from 'antd';
import { useUserStore } from '../store/useUserStore';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    const errorMsg = response?.data?.error || response?.data?.message || error.message || '未知错误';
    const status = response?.status;

    // 调试模式下打印详细错误
    console.error('[API Error]', {
      status,
      message: errorMsg,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      response: response?.data
    });

    if (response) {
      switch (status) {
        case 401:
          notification.error({
            message: '认证失效',
            description: `[${status}] ${errorMsg}。请尝试刷新页面或重新登录。`,
            duration: 5,
          });
          // 不再强制重定向，仅清除本地状态，让 ProtectedRoute 自然生效或由用户手动操作
          useUserStore.getState().logout();
          break;
        case 403:
          notification.warning({
            message: '权限不足',
            description: `[${status}] 您没有权限访问该资源: ${errorMsg}`,
          });
          break;
        case 500:
          notification.error({
            message: '服务器错误',
            description: `[${status}] 服务器运行异常，请联系管理员。详情: ${errorMsg}`,
            duration: 0, // 500 错误不自动关闭，方便调试
          });
          break;
        default:
          notification.error({
            message: '请求失败',
            description: `[${status || 'Client'}] ${errorMsg}`,
          });
      }
    } else {
      notification.error({
        message: '网络异常',
        description: '无法连接到服务器，请检查网络设置或后端服务是否启动。',
      });
    }
    return Promise.reject(error);
  }
);

export default instance;
