import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Space, Divider, Typography, Alert, Breadcrumb } from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const StoragePolicyConfig: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedType, setSelectedType] = useState('local');

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res: any = await request.get(`/admin/policy/${id}`);
      const policy = res.data;
      setSelectedType(policy.Type);
      
      // 解析 JSON 配置
      let config = {};
      try {
        config = JSON.parse(policy.Config);
      } catch (e) {
        console.error('Failed to parse config:', e);
      }

      form.setFieldsValue({
        Name: policy.Name,
        Type: policy.Type,
        BaseURL: policy.BaseURL,
        ...config
      });
    } catch (err) {
      antdGlobal.message.error('获取策略详情失败');
    } finally {
      setLoading(false);
    }
  };

  const onTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      
      // 提取配置字段
      const configFields = getConfigFields(selectedType);
      const config: Record<string, any> = {};
      configFields.forEach(field => {
        config[field.name] = values[field.name];
      });

      await request.post('/admin/policy/test', {
        type: selectedType,
        config: JSON.stringify(config)
      });
      antdGlobal.message.success('连接测试成功！');
    } catch (err: any) {
      antdGlobal.message.error(err.response?.data?.error || '连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 提取配置字段
      const configFields = getConfigFields(selectedType);
      const config: Record<string, any> = {};
      configFields.forEach(field => {
        config[field.name] = values[field.name];
      });

      const payload = {
        Name: values.Name,
        Type: values.Type,
        BaseURL: values.BaseURL,
        Config: JSON.stringify(config),
        Status: 1
      };

      if (isEdit) {
        await request.put(`/admin/policy/${id}`, payload);
        antdGlobal.message.success('更新成功');
      } else {
        await request.post('/admin/policy', payload);
        antdGlobal.message.success('创建成功');
      }
      navigate('/admin/policies');
    } catch (err) {
      antdGlobal.message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const getConfigFields = (type: string) => {
    switch (type) {
      case 'local':
        return [
          { name: 'root', label: '根目录', placeholder: '例如：data/uploads', help: '文件存储在服务器上的绝对或相对路径。' }
        ];
      case 'oss':
        return [
          { name: 'endpoint', label: 'Endpoint', placeholder: '例如：oss-cn-hangzhou.aliyuncs.com', help: '阿里云 OSS 的地域节点。' },
          { name: 'accessKey', label: 'Access Key ID', placeholder: '你的 Access Key ID', help: '阿里云 RAM 用户的访问密钥。' },
          { name: 'secretKey', label: 'Access Key Secret', placeholder: '你的 Access Key Secret', help: '阿里云 RAM 用户的访问密钥。', isPassword: true },
          { name: 'bucket', label: 'Bucket 名称', placeholder: '你的 Bucket 名称', help: 'OSS 存储桶名称。' }
        ];
      case 's3':
        return [
          { name: 'endpoint', label: 'Endpoint', placeholder: '例如：https://s3.amazonaws.com', help: 'S3 兼容服务的访问地址。' },
          { name: 'region', label: 'Region (地域)', placeholder: '例如：us-east-1', help: 'S3 服务所在的地域。' },
          { name: 'accessKey', label: 'Access Key', placeholder: '你的 Access Key', help: '访问密钥 ID。' },
          { name: 'secretKey', label: 'Secret Key', placeholder: '你的 Secret Key', help: '访问密钥 Secret。', isPassword: true },
          { name: 'bucket', label: 'Bucket 名称', placeholder: '你的 Bucket 名称', help: 'S3 存储桶名称。' }
        ];
      case 'cos':
        return [
          { name: 'bucketUrl', label: '存储桶 URL', placeholder: '例如：https://example-123.cos.ap-guangzhou.myqcloud.com', help: '腾讯云 COS 存储桶的访问域名。' },
          { name: 'secretId', label: 'Secret ID', placeholder: '你的 Secret ID', help: '腾讯云访问密钥 ID。' },
          { name: 'secretKey', label: 'Secret Key', placeholder: '你的 Secret Key', help: '腾讯云访问密钥 Secret。', isPassword: true }
        ];
      case 'onedrive':
        return [
          { name: 'client_id', label: 'Client ID', placeholder: 'Azure 应用的 Client ID', help: '在 Azure 门户注册的应用 ID。' },
          { name: 'client_secret', label: 'Client Secret', placeholder: 'Azure 应用的 Client Secret', help: '在 Azure 门户生成的应用机密。', isPassword: true },
          { name: 'refresh_token', label: 'Refresh Token', placeholder: '你的 Refresh Token', help: '通过 OAuth2 流程获取的刷新令牌。', isTextArea: true },
          { name: 'root_path', label: '根目录', placeholder: '例如：/Netdisk', help: 'OneDrive 中的起始存储路径。' }
        ];
      default:
        return [];
    }
  };

  const typeIcons: Record<string, any> = {
    local: <DatabaseOutlined />,
    oss: <CloudServerOutlined />,
    s3: <GlobalOutlined />,
    cos: <CloudServerOutlined />,
    onedrive: <RocketOutlined />
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Space direction="vertical" size={0}>
          <Breadcrumb 
            items={[
              { title: '管理后台', href: '/admin' },
              { title: '存储策略', href: '/admin/policies' },
              { title: isEdit ? '编辑策略' : '新建策略' },
            ]} 
            className="mb-2"
          />
          <div className="flex items-center gap-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/admin/policies')}
              className="!rounded-xl border-none shadow-sm hover:bg-white dark:hover:bg-neutral-800"
            />
            <Title level={2} className="!m-0 dark:text-slate-100">
              {isEdit ? '编辑存储策略' : '新建存储策略'}
            </Title>
          </div>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ Type: 'local' }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧基本信息 */}
          <div className="md:col-span-1 space-y-6">
            <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
              <Title level={4} className="mb-6 flex items-center gap-2 dark:text-slate-200">
                <InfoCircleOutlined className="text-stfreya-500" />
                基本信息
              </Title>
              
              <Form.Item
                name="Name"
                label={<Text className="dark:text-slate-400">策略名称</Text>}
                rules={[{ required: true, message: '请输入策略名称' }]}
              >
                <Input placeholder="给策略起个名字" className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
              </Form.Item>

              <Form.Item
                name="Type"
                label={<Text className="dark:text-slate-400">存储类型</Text>}
                rules={[{ required: true, message: '请选择存储类型' }]}
              >
                <Select onChange={onTypeChange} className="dark:ant-select-dark">
                  <Option value="local">本地存储</Option>
                  <Option value="oss">阿里云 OSS</Option>
                  <Option value="s3">S3 兼容存储</Option>
                  <Option value="cos">腾讯云 COS</Option>
                  <Option value="onedrive">OneDrive</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="BaseURL"
                label={<Text className="dark:text-slate-400">直链基础 URL</Text>}
                extra={<Text type="secondary" className="text-xs">可选，用于生成文件直链</Text>}
              >
                <Input placeholder="https://cdn.example.com" className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
              </Form.Item>
            </Card>

            <Alert
              message="温馨提示"
              description="配置完成后，建议先点击下方“测试连接”按钮，确保配置无误后再保存。"
              type="info"
              showIcon
              className="!rounded-2xl border-none bg-blue-50/50 dark:bg-blue-900/10"
            />
          </div>

          {/* 右侧详细配置 */}
          <div className="md:col-span-2">
            <motion.div
              key={selectedType}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 min-h-[500px]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-stfreya-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/30">
                    {typeIcons[selectedType] || <DatabaseOutlined />}
                  </div>
                  <div>
                    <Title level={4} className="!m-0 dark:text-slate-200">
                      {selectedType.toUpperCase()} 详细配置
                    </Title>
                    <Text type="secondary" className="dark:text-slate-500">
                      请根据服务商提供的参数进行填写
                    </Text>
                  </div>
                </div>

                <Divider className="dark:border-neutral-800" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {getConfigFields(selectedType).map(field => (
                    <Form.Item
                      key={field.name}
                      name={field.name}
                      label={<Text className="dark:text-slate-400">{field.label}</Text>}
                      rules={[{ required: true, message: `请输入${field.label}` }]}
                      extra={<Text type="secondary" className="text-xs opacity-70">{field.help}</Text>}
                      className={field.isTextArea ? "md:col-span-2" : ""}
                    >
                      {field.isPassword ? (
                        <Input.Password 
                          placeholder={field.placeholder} 
                          className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" 
                        />
                      ) : field.isTextArea ? (
                        <Input.TextArea 
                          rows={4}
                          placeholder={field.placeholder} 
                          className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" 
                        />
                      ) : (
                        <Input 
                          placeholder={field.placeholder} 
                          className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" 
                        />
                      )}
                    </Form.Item>
                  ))}
                </div>

                <div className="mt-12 flex justify-between items-center bg-slate-50 dark:bg-neutral-800/50 p-6 rounded-2xl">
                  <Button 
                    icon={<CheckCircleOutlined />} 
                    onClick={handleTest}
                    loading={testing}
                    className="h-11 !rounded-xl border-stfreya-200 text-stfreya-500 hover:text-stfreya-600 hover:border-stfreya-300 dark:border-neutral-700"
                  >
                    测试连接
                  </Button>
                  <Space size="middle">
                    <Button 
                      onClick={() => navigate('/admin/policies')}
                      className="h-11 !rounded-xl border-none bg-slate-200/50 dark:bg-neutral-700 dark:text-slate-300"
                    >
                      取消
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />} 
                      loading={loading}
                      className="h-11 px-8 !rounded-xl bg-stfreya-500 hover:bg-stfreya-600 border-none shadow-lg shadow-stfreya-200 dark:shadow-none"
                    >
                      保存配置
                    </Button>
                  </Space>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default StoragePolicyConfig;