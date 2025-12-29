import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, ConfigProvider } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  KeyOutlined, 
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';
import { useConfigStore } from '../../store/useConfigStore';
import request from '../../utils/request';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { allowRegister, siteName, fetchPublicConfigs } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ id: '', img: '' });

  const fetchCaptcha = async () => {
    try {
      const res: any = await request.get('/auth/captcha');
      setCaptcha({ id: res.captchaId, img: res.captchaImg });
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  useEffect(() => {
    fetchCaptcha();
    fetchPublicConfigs();
  }, []);

  if (!allowRegister) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-[#141414]' : 'bg-[#f0f7ff]'}`}>
        <Card className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">注册已关闭</h2>
          <p className="text-gray-500 mb-6">抱歉，当前站点暂时不开放新用户注册。</p>
          <Button type="primary" onClick={() => navigate('/login')}>返回登录</Button>
        </Card>
      </div>
    );
  }

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await request.post('/auth/register', {
        username: values.username,
        email: values.email,
        password: values.password,
        invitationCode: values.invitationCode,
        captchaId: captcha.id,
        captchaValue: values.captcha,
      });
      message.success('注册成功！欢迎加入');
      navigate('/login');
    } catch (error: any) {
      // 错误已由拦截器全局处理，此处仅需刷新验证码
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#409EFF',
          borderRadius: 12,
          colorBgContainer: isDarkMode ? '#1d1e1f' : '#ffffff',
          colorBorder: isDarkMode ? '#4c4d4f' : '#e4e7ed',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 42,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 42,
          }
        }
      }}
    >
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-[#141414]' : 'bg-[#f0f7ff]'}`}>
        {/* 治愈系背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[80px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              x: [0, -30, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 dark:bg-indigo-900/10 blur-[80px]" 
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} 
            style={{ backgroundImage: 'radial-gradient(#409EFF 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[480px] relative z-10"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#409EFF] to-[#79bbff] rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#409EFF]/20">
                {siteName ? siteName.charAt(0).toUpperCase() : 'S'}
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">加入 {siteName || 'Stfreya Netdisk'}</h1>
            <p className="text-gray-400 dark:text-gray-500 mt-2 font-medium">开启您的轻盈云端之旅</p>
          </div>

          <Card 
            className="shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/60 dark:border-gray-800 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
            styles={{ body: { padding: '40px' } }}
          >
            <Form
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label={<span className="text-sm text-gray-500 font-medium">用户名</span>}
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400 mr-2" />} 
                  placeholder="设置你的学号" 
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-sm text-gray-500 font-medium">电子邮箱</span>}
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '邮箱格式不正确' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined className="text-gray-400 mr-2" />} 
                  placeholder="联络邮箱" 
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="text-sm text-gray-500 font-medium">登录密码</span>}
                rules={[{ required: true, message: '请设置密码' }, { min: 6, message: '密码至少6位' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400 mr-2" />}
                  placeholder="不少于6位字符"
                />
              </Form.Item>

              <Form.Item
                name="invitationCode"
                label={<span className="text-sm text-gray-500 font-medium">邀请码</span>}
                rules={[{ required: true, message: '请输入邀请码' }]}
              >
                <Input 
                  prefix={<KeyOutlined className="text-gray-400 mr-2" />} 
                  placeholder="通过学园币兑换" 
                />
              </Form.Item>

              <Form.Item label={<span className="text-sm text-gray-500 font-medium">验证码</span>} required>
                <div className="flex items-center gap-3">
                  <Form.Item name="captcha" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
                    <Input 
                      prefix={<SafetyCertificateOutlined className="text-gray-400 mr-2" />} 
                      placeholder="验证码" 
                      className="flex-1"
                    />
                  </Form.Item>
                  <div 
                    onClick={fetchCaptcha}
                    className="w-[120px] h-[40px] bg-gray-50 dark:bg-gray-800 border border-[#dcdfe6] dark:border-[#4c4d4f] rounded cursor-pointer hover:border-[#409EFF] transition-all overflow-hidden shrink-0"
                  >
                    {captcha.img ? (
                      <img src={captcha.img} alt="captcha" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">加载中</div>
                    )}
                  </div>
                </div>
              </Form.Item>

              <Form.Item className="mt-8 mb-4">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  className="font-medium shadow-sm"
                  icon={<UserAddOutlined />}
                >
                  提交申请
                </Button>
              </Form.Item>

              <div className="text-center">
                <Link to="/login">
                  <Button type="link" className="text-gray-500 hover:text-[#409EFF] text-sm flex items-center justify-center gap-1 mx-auto">
                    <ArrowLeftOutlined /> 返回登录
                  </Button>
                </Link>
              </div>
            </Form>
          </Card>

          <p className="text-center mt-8 text-gray-400 text-xs">
            注册即代表同意 <span className="text-[#409EFF] cursor-pointer">服务协议</span> 与 <span className="text-[#409EFF] cursor-pointer">隐私政策</span>
          </p>
        </motion.div>
      </div>
    </ConfigProvider>
  );
};

export default Register;
