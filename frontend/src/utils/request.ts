import axios from 'axios';
import antdGlobal from './antd';
import { useAuthStore } from '../store';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
      antdGlobal.message?.error(data.error || '请求失败');
    } else {
      antdGlobal.message?.error('网络错误，请检查您的网络连接');
    }
    return Promise.reject(error);
  }
);

export default request;
