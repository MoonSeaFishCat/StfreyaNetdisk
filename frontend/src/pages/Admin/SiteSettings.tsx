import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, InputNumber, Tabs, Divider } from 'antd';
import { SaveOutlined, GlobalOutlined, SecurityScanOutlined, GiftOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const SiteSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/configs');
      const configMap: Record<string, any> = {};
      res.data.forEach((item: any) => {
        let val = item.value;
        if (item.type === 'bool') val = item.value === 'true';
        if (item.type === 'int') val = parseInt(item.value);
        configMap[item.key] = val;
      });
      form.setFieldsValue(configMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const updates: Record<string, string> = {};
      Object.keys(values).forEach(key => {
        updates[key] = String(values[key]);
      });
      await request.post('/admin/configs', updates);
      antdGlobal.message.success('设置已保存');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'basic',
      label: <span className="flex items-center gap-2 dark:text-slate-300"><GlobalOutlined />常规设置</span>,
      children: (
        <div className="max-w-2xl space-y-6 py-4">
          <Form.Item name="site_name" label={<span className="dark:text-slate-300">站点名称</span>} rules={[{ required: true }]}>
            <Input placeholder="输入您的网盘名称" className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
          <Form.Item name="site_announcement" label={<span className="dark:text-slate-300">站点公告</span>}>
            <Input.TextArea rows={4} placeholder="显示在首页的公告内容" className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
          <Form.Item name="allow_register" label={<span className="dark:text-slate-300">允许新用户注册</span>} valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'quota',
      label: <span className="flex items-center gap-2 dark:text-slate-300"><SecurityScanOutlined />配额与限制</span>,
      children: (
        <div className="max-w-2xl space-y-6 py-4">
          <Form.Item name="default_quota" label={<span className="dark:text-slate-300">默认用户空间 (Bytes)</span>}>
            <InputNumber className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-[-20px]">10GB = 10737418240 Bytes</p>
        </div>
      ),
    },
    {
      key: 'coin',
      label: <span className="flex items-center gap-2 dark:text-slate-300"><GiftOutlined />经济系统</span>,
      children: (
        <div className="max-w-2xl space-y-6 py-4">
          <Form.Item name="signin_reward" label={<span className="dark:text-slate-300">每日签到奖励 (学园币)</span>}>
            <InputNumber min={0} className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
          <Form.Item name="invite_cost" label={<span className="dark:text-slate-300">生成邀请码成本 (学园币)</span>}>
            <InputNumber min={0} className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
          <Divider className="dark:border-neutral-800 dark:text-slate-400 text-xs">动态奖励</Divider>
          <Form.Item name="upload_reward" label={<span className="dark:text-slate-300">上传文件奖励 (学园币)</span>}>
            <InputNumber min={0} className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
          <Form.Item name="share_reward" label={<span className="dark:text-slate-300">创建分享奖励 (学园币)</span>}>
            <InputNumber min={0} className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">站点配置</h2>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          loading={loading}
          onClick={() => form.submit()}
        >
          保存配置
        </Button>
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Tabs items={items} className="dark:text-slate-300" />
        </Form>
      </Card>
    </div>
  );
};

export default SiteSettings;
