import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, CloudOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import request from '../utils/request';

import { useAuthStore } from '../store';
import antdGlobal from '../utils/antd';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [captchaData, setCaptchaData] = useState({ id: '', img: '' });
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const fetchCaptcha = async () => {
    try {
      const res: any = await request.get('/auth/captcha');
      setCaptchaData({ id: res.captchaId, img: res.captchaImg });
    } catch (err) {
      antdGlobal.message.error('获取验证码失败');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await request.post('/auth/login', {
        ...values,
        captchaId: captchaData.id,
      });
      setAuth(res.token, res.user);
      antdGlobal.message.success('欢迎回来！');
      navigate('/');
    } catch (err) {
      // 登录失败通常需要刷新验证码
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stfreya-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-stfreya-200 dark:bg-stfreya-900/20 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stfreya-500 rounded-2xl text-white text-3xl shadow-xl shadow-stfreya-200 dark:shadow-stfreya-900/50 mb-4">
            <CloudOutlined />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Stfreya Netdisk</h1>
          <p className="text-slate-400 dark:text-slate-500 mt-2">简单、纯净、治愈的云端存储体验</p>
        </div>

        <Card className="!rounded-3xl shadow-xl shadow-stfreya-100/50 dark:shadow-black/50 border-none p-4 dark:bg-neutral-900">
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-slate-300 dark:text-slate-600" />} 
                placeholder="用户名" 
                className="!bg-slate-50 dark:!bg-neutral-800 border-none dark:text-slate-200"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-300 dark:text-slate-600" />}
                placeholder="密码"
                className="!bg-slate-50 dark:!bg-neutral-800 border-none dark:text-slate-200"
              />
            </Form.Item>

            <Form.Item
              name="captchaValue"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div className="flex gap-2">
                <Input
                  prefix={<SafetyOutlined className="text-slate-300 dark:text-slate-600" />}
                  placeholder="验证码"
                  className="flex-1 !bg-slate-50 dark:!bg-neutral-800 border-none dark:text-slate-200"
                />
                <div 
                  className="w-32 h-10 bg-white dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center border border-slate-100 dark:border-neutral-700"
                  onClick={fetchCaptcha}
                  title="点击刷新验证码"
                >
                  {captchaData.img ? (
                    <img src={captchaData.img} alt="captcha" className="w-full h-full object-cover" />
                  ) : (
                    <ReloadOutlined className="text-slate-300 animate-spin" />
                  )}
                </div>
              </div>
            </Form.Item>

            <div className="flex justify-between items-center mb-6 px-1">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-slate-500 dark:text-slate-400 text-sm">记住我</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" title='??' className="text-stfreya-400 text-sm hover:text-stfreya-500">
                忘记密码？
              </Link>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full h-12 !rounded-xl text-lg font-bold shadow-lg shadow-stfreya-200" 
                loading={loading}
              >
                开启治愈之旅
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-slate-400 text-sm">
            还没有账号？{' '}
            <Link to="/register" className="text-stfreya-400 font-bold hover:text-stfreya-500">
              立即加入
            </Link>
          </div>
        </Card>

        <p className="text-center text-slate-300 text-xs mt-12">
          &copy; 2025 Stfreya Netdisk. Made with Love.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
