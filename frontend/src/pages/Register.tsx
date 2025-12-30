import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, CloudOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import request from '../utils/request';
import antdGlobal from '../utils/antd';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [captchaData, setCaptchaData] = useState({ id: '', img: '' });
  const navigate = useNavigate();

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
      await request.post('/auth/register', {
        ...values,
        captchaId: captchaData.id,
      });
      antdGlobal.message.success('注册成功，请登录！');
      navigate('/login');
    } catch (err) {
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stfreya-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-stfreya-200 dark:bg-stfreya-900/20 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stfreya-500 rounded-2xl text-white text-3xl shadow-xl shadow-stfreya-200 dark:shadow-stfreya-900/50 mb-4">
            <CloudOutlined />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">加入 Stfreya</h1>
          <p className="text-slate-400 dark:text-slate-500 mt-2">开启您的治愈系云端生活</p>
        </div>

        <Card className="!rounded-3xl shadow-xl shadow-stfreya-100/50 dark:shadow-black/50 border-none p-4 dark:bg-neutral-900">
          <Form
            name="register"
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
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className="text-slate-300 dark:text-slate-600" />} 
                placeholder="电子邮箱" 
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
              name="invitationCode"
              rules={[{ required: true, message: '请输入邀请码' }]}
            >
              <Input 
                prefix={<SafetyOutlined className="text-slate-300 dark:text-slate-600" />} 
                placeholder="邀请码" 
                className="!bg-slate-50 dark:!bg-neutral-800 border-none dark:text-slate-200"
              />
            </Form.Item>

            <div className="flex gap-2 mb-6">
              <Form.Item
                name="captchaValue"
                rules={[{ required: true, message: '请输入验证码' }]}
                className="flex-1 mb-0"
              >
                <Input 
                  prefix={<ReloadOutlined className="text-slate-300 dark:text-slate-600" />} 
                  placeholder="验证码" 
                  className="!bg-slate-50 dark:!bg-neutral-800 border-none dark:text-slate-200"
                />
              </Form.Item>
              <div 
                className="h-[40px] w-32 bg-slate-100 dark:bg-neutral-800 rounded-xl cursor-pointer overflow-hidden flex items-center justify-center"
                onClick={fetchCaptcha}
              >
                {captchaData.img ? (
                  <img src={captchaData.img} alt="captcha" className="h-full w-full object-cover" />
                ) : (
                  <ReloadOutlined className="text-slate-400 animate-spin" />
                )}
              </div>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full h-12 !rounded-xl text-lg font-bold shadow-lg shadow-stfreya-200 mt-2" 
                loading={loading}
              >
                立即注册
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-slate-400 text-sm">
            已经有账号了？{' '}
            <Link to="/login" className="text-stfreya-400 font-bold hover:text-stfreya-500">
              去登录
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
