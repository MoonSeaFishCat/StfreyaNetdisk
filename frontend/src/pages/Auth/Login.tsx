import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Checkbox, message, ConfigProvider, Tabs } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ArrowRightOutlined, QrcodeOutlined, UserAddOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';
import { useUserStore } from '../../store/useUserStore';
import { useConfigStore } from '../../store/useConfigStore';
import request from '../../utils/request';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { setUser } = useUserStore();
  const { siteName, siteAnnouncement, fetchPublicConfigs } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ id: '', img: '' });
  const [activeTab, setActiveTab] = useState('1');

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

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await request.post('/auth/login', {
        username: values.username,
        password: values.password,
        captchaId: captcha.id,
        captchaValue: values.captcha,
      });
      
      setUser(res.user, res.token);
      message.success('欢迎回来！正在进入系统...');
      navigate('/');
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
          },
          Tabs: {
            titleFontSize: 16,
            horizontalItemPadding: '12px 20px',
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
            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[80px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              x: [0, -30, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 dark:bg-indigo-900/10 blur-[80px]" 
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} 
            style={{ backgroundImage: 'radial-gradient(#409EFF 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="text-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="inline-block p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-5 border border-white dark:border-gray-700"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#409EFF] to-[#79bbff] rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#409EFF]/20">
                {siteName ? siteName.charAt(0).toUpperCase() : 'S'}
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{siteName || 'Stfreya Netdisk'}</h1>
            <p className="text-gray-400 dark:text-gray-500 mt-2 font-medium">{siteAnnouncement || '遇见轻盈，存储美好'}</p>
          </div>

          <Card 
            className="shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/60 dark:border-gray-800 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
            styles={{ body: { padding: '40px' } }}
          >
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              centered
              items={[
                {
                  key: '1',
                  label: '账号登录',
                },
                {
                  key: '2',
                  label: '扫码登录',
                },
              ]}
              className="mb-6"
            />

            <AnimatePresence mode="wait">
              {activeTab === '1' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input 
                        prefix={<UserOutlined className="text-gray-400 mr-2" />} 
                        placeholder="用户名 / 邮箱" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-400 mr-2" />}
                        placeholder="密码"
                      />
                    </Form.Item>

                    <div className="flex items-center gap-3 mb-6">
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

                    <div className="flex justify-between items-center mb-6">
                      <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox className="text-gray-500 text-sm">记住我</Checkbox>
                      </Form.Item>
                      <a className="text-[#409EFF] hover:text-[#66b1ff] transition-colors text-sm">
                        忘记密码？
                      </a>
                    </div>

                    <Form.Item className="mb-4">
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        block
                        className="font-medium shadow-sm"
                      >
                        登 录
                      </Button>
                    </Form.Item>

                    <div className="text-center">
                      <Link to="/register">
                        <Button type="link" className="text-gray-500 hover:text-[#409EFF] text-sm flex items-center justify-center gap-1 mx-auto">
                          <UserAddOutlined /> 注册新账号
                        </Button>
                      </Link>
                    </div>
                  </Form>
                </motion.div>
              ) : (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center py-6"
                >
                  <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-[#ebeef5] dark:border-[#303133] shadow-sm relative group">
                    <div className="w-40 h-40 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
                      <QrcodeOutlined className="text-6xl text-gray-200" />
                    </div>
                    <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#409EFF] flex items-center justify-center text-white mb-2">
                        <ArrowRightOutlined />
                      </div>
                      <span className="text-xs text-gray-500">点击刷新</span>
                    </div>
                  </div>
                  <p className="mt-6 text-gray-500 text-sm">请使用移动端 App 扫码登录</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <div className="text-center mt-8 text-gray-400 text-xs">
            © 2025 Stfreya Netdisk · 高性能云端存储
          </div>
        </motion.div>
      </div>
    </ConfigProvider>
  );
};

export default Login;
