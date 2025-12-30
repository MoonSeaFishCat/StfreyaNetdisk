import React, { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleUpdate = async (values: any) => {
    setLoading(true);
    try {
      await request.put('/user/profile', {
        email: values.email,
        password: values.password,
        avatar: values.avatar,
      });
      antdGlobal.message.success('更新成功');
      
      // 重新获取用户信息
      const res: any = await request.get('/user/info');
      setUser(res.user);
      form.setFieldsValue({ password: '' });
    } catch (err: any) {
      antdGlobal.message.error(err.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
          <div className="flex flex-col items-center py-8">
            <div className="relative group cursor-pointer">
              <Avatar 
                size={120} 
                src={user?.avatar || undefined} 
                icon={<UserOutlined />} 
                className="bg-stfreya-500 ring-4 ring-stfreya-100 dark:ring-neutral-800"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraOutlined className="text-white text-2xl" />
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">{user?.username}</h2>
            <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs font-semibold mt-1">
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </p>
          </div>

          <Divider className="dark:border-neutral-800" />

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              email: user?.email,
              avatar: user?.avatar,
            }}
            onFinish={handleUpdate}
            className="px-4"
          >
            <Form.Item
              name="email"
              label={<span className="dark:text-slate-300 font-medium">电子邮箱</span>}
              rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input 
                prefix={<MailOutlined className="text-slate-400" />} 
                placeholder="你的邮箱"
                className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
              />
            </Form.Item>

            <Form.Item
              name="avatar"
              label={<span className="dark:text-slate-300 font-medium">头像 URL</span>}
            >
              <Input 
                prefix={<CameraOutlined className="text-slate-400" />} 
                placeholder="头像链接"
                className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="dark:text-slate-300 font-medium">新密码</span>}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="若不修改请留空"
                className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
              />
            </Form.Item>

            <Form.Item className="mt-8">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-12 !rounded-xl bg-stfreya-500 hover:bg-stfreya-600 border-none shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50 text-lg font-bold"
              >
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">账号统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">已用容量</p>
              <p className="text-xl font-bold text-stfreya-500">{((user?.usedSize || 0) / 1024 / 1024 / 1024).toFixed(2)} GB</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">总容量</p>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{((user?.totalSize || 0) / 1024 / 1024 / 1024).toFixed(0)} GB</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">学园币</p>
              <p className="text-xl font-bold text-amber-500">{user?.coin || 0}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Profile;
