import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, InputNumber, Card, Spin, message, Space, Typography, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import request from '../../utils/request';

const { Title, Paragraph } = Typography;

const SystemSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res: any = await request.get('/admin/configs');
      const configMap: any = {};
      res.data.forEach((cfg: any) => {
        let val: any = cfg.Value;
        if (cfg.Type === 'int') val = parseInt(val);
        if (cfg.Type === 'bool') val = val === 'true';
        configMap[cfg.Key] = val;
      });
      form.setFieldsValue(configMap);
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      const submitData: any = {};
      Object.keys(values).forEach(key => {
        submitData[key] = String(values[key]);
      });
      await request.post('/admin/configs', submitData);
      message.success('系统配置已更新');
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="萌系圆角 shadow-xl border-none">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="mb-0"><SettingOutlined className="mr-2" />全局系统配置</Title>
          <Button icon={<ReloadOutlined />} onClick={fetchConfigs} className="萌系圆角">刷新</Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Divider>基础设置</Divider>
          <div className="grid grid-cols-2 gap-6">
            <Form.Item
              name="site_name"
              label="站点名称"
              rules={[{ required: true, message: '请输入站点名称' }]}
            >
              <Input className="萌系圆角" placeholder="Stfreya Netdisk" />
            </Form.Item>
            <Form.Item
              name="allow_register"
              label="允许新用户注册"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>

          <Form.Item
            name="site_announcement"
            label="站点公告"
          >
            <Input.TextArea className="萌系圆角" rows={3} placeholder="显示在首页或登录页的公告内容" />
          </Form.Item>

          <Divider>默认策略与配额</Divider>
          <div className="grid grid-cols-2 gap-6">
            <Form.Item
              name="default_quota"
              label="新用户默认空间 (字节)"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full 萌系圆角" min={0} />
            </Form.Item>
            <div className="flex items-center text-gray-400 text-sm">
              提示：10GB = 10737418240 字节
            </div>
          </div>

          <Divider>经济系统配置</Divider>
          <div className="grid grid-cols-2 gap-6">
            <Form.Item
              name="signin_reward"
              label="每日签到奖励 (学园币)"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full 萌系圆角" min={0} />
            </Form.Item>
            <Form.Item
              name="invite_cost"
              label="生成邀请码消耗 (学园币)"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full 萌系圆角" min={0} />
            </Form.Item>
          </div>

          <Form.Item className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              block
              size="large"
              className="萌系圆角 shadow-lg"
            >
              保存系统配置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="萌系圆角 bg-stfreya-pink/5 border-none">
        <Paragraph type="secondary" className="mb-0">
          <Space>
            <SettingOutlined />
            系统配置将实时保存在数据库中，部分配置（如站点名称）可能需要刷新页面后生效。
          </Space>
        </Paragraph>
      </Card>
    </div>
  );
};

export default SystemSettings;
