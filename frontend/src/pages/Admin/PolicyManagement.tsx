import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Switch } from 'antd';
import request from '../../utils/request';

const PolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('local');
  const [form] = Form.useForm();

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/policies');
      setPolicies(res.data);
    } catch (error) {
      message.error('获取存储策略失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      // 转换配置信息为 JSON 字符串
      const configObj: any = {};
      if (values.type === 'local') {
        configObj.root = values.local_root;
      } else if (values.type === 's3') {
        configObj.endpoint = values.s3_endpoint;
        configObj.bucket = values.s3_bucket;
        configObj.accessKey = values.s3_ak;
        configObj.secretKey = values.s3_sk;
        configObj.region = values.s3_region;
      } else if (values.type === 'oss') {
        configObj.endpoint = values.oss_endpoint;
        configObj.bucket = values.oss_bucket;
        configObj.accessKey = values.oss_ak;
        configObj.secretKey = values.oss_sk;
      } else if (values.type === 'cos') {
        configObj.endpoint = values.cos_endpoint;
        configObj.bucket = values.cos_bucket;
        configObj.accessKey = values.cos_ak;
        configObj.secretKey = values.cos_sk;
      } else if (values.type === 'sftp') {
        configObj.host = values.sftp_host;
        configObj.port = parseInt(values.sftp_port) || 22;
        configObj.user = values.sftp_user;
        configObj.password = values.sftp_password;
        configObj.root = values.sftp_root;
        configObj.privateKey = values.sftp_key; // 支持私钥配置
      } else if (values.type === 'onedrive') {
        configObj.clientID = values.od_client_id;
        configObj.clientSecret = values.od_client_secret;
        configObj.tenantID = values.od_tenant_id || 'common';
        configObj.redirectURI = values.od_redirect_uri;
        configObj.refreshToken = values.od_refresh_token; // 初始 Token
      }

      const submitData = {
        name: values.name,
        type: values.type,
        isDefault: values.isDefault,
        config: JSON.stringify(configObj)
      };

      await request.post('/admin/policy', submitData);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchPolicies();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const renderConfigFields = () => {
    switch (selectedType) {
      case 'local':
        return (
          <Form.Item name="local_root" label="根目录" rules={[{ required: true }]} initialValue="./data/uploads">
            <Input className="萌系圆角" placeholder="例如: ./data/uploads" />
          </Form.Item>
        );
      case 's3':
        return (
          <>
            <Form.Item name="s3_endpoint" label="Endpoint" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="s3.amazonaws.com" />
            </Form.Item>
            <Form.Item name="s3_region" label="Region" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="us-east-1" />
            </Form.Item>
            <Form.Item name="s3_bucket" label="Bucket" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="s3_ak" label="AccessKey" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="s3_sk" label="SecretKey" rules={[{ required: true }]}>
              <Input.Password className="萌系圆角" />
            </Form.Item>
          </>
        );
      case 'oss':
        return (
          <>
            <Form.Item name="oss_endpoint" label="Endpoint" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="oss-cn-hangzhou.aliyuncs.com" />
            </Form.Item>
            <Form.Item name="oss_bucket" label="Bucket" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="oss_ak" label="AccessKey" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="oss_sk" label="SecretKey" rules={[{ required: true }]}>
              <Input.Password className="萌系圆角" />
            </Form.Item>
          </>
        );
      case 'cos':
        return (
          <>
            <Form.Item name="cos_endpoint" label="Endpoint (Region)" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="ap-shanghai" />
            </Form.Item>
            <Form.Item name="cos_bucket" label="Bucket" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="cos_ak" label="SecretID" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="cos_sk" label="SecretKey" rules={[{ required: true }]}>
              <Input.Password className="萌系圆角" />
            </Form.Item>
          </>
        );
      case 'sftp':
        return (
          <>
            <Form.Item name="sftp_host" label="主机地址" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="1.2.3.4" />
            </Form.Item>
            <Form.Item name="sftp_port" label="端口" initialValue="22">
              <Input className="萌系圆角" placeholder="22" />
            </Form.Item>
            <Form.Item name="sftp_user" label="用户名" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="sftp_password" label="密码">
              <Input.Password className="萌系圆角" placeholder="留空则使用密钥登录" />
            </Form.Item>
            <Form.Item name="sftp_key" label="私钥内容">
              <Input.TextArea className="萌系圆角" rows={4} placeholder="-----BEGIN RSA PRIVATE KEY-----" />
            </Form.Item>
            <Form.Item name="sftp_root" label="存储根路径" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="/home/user/stfreya" />
            </Form.Item>
          </>
        );
      case 'onedrive':
        return (
          <>
            <Form.Item name="od_client_id" label="Client ID" rules={[{ required: true }]}>
              <Input className="萌系圆角" />
            </Form.Item>
            <Form.Item name="od_client_secret" label="Client Secret" rules={[{ required: true }]}>
              <Input.Password className="萌系圆角" />
            </Form.Item>
            <Form.Item name="od_tenant_id" label="Tenant ID" initialValue="common">
              <Input className="萌系圆角" placeholder="common" />
            </Form.Item>
            <Form.Item name="od_redirect_uri" label="回调地址" rules={[{ required: true }]}>
              <Input className="萌系圆角" placeholder="/api/v1/callback/onedrive" />
            </Form.Item>
            <Form.Item name="od_refresh_token" label="Refresh Token" rules={[{ required: true }]}>
              <Input.TextArea className="萌系圆角" rows={3} placeholder="通过 OAuth2 获取的 Refresh Token" />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'ID', key: 'ID' },
    { title: '名称', dataIndex: 'Name', key: 'Name' },
    { 
      title: '类型', 
      dataIndex: 'Type', 
      key: 'Type',
      render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>
    },
    { 
      title: '默认', 
      dataIndex: 'IsDefault', 
      key: 'IsDefault',
      render: (isDefault: boolean) => isDefault ? <Tag color="green">默认</Tag> : null
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" onClick={() => {
            Modal.info({
              title: `${record.Name} 配置详情`,
              content: <pre className="bg-gray-100 p-2 rounded mt-2">{JSON.stringify(JSON.parse(record.Config), null, 2)}</pre>,
              className: "萌系圆角"
            });
          }}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button 
          type="primary" 
          onClick={() => {
            setSelectedType('local');
            setModalVisible(true);
          }}
          className="萌系圆角 bg-stfreya-pink border-none"
        >
          添加策略
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={policies} 
        loading={loading} 
        rowKey="ID"
        className="萌系表格"
      />

      <Modal
        title="添加存储策略"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="萌系圆角"
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
            <Input className="萌系圆角" />
          </Form.Item>
          <Form.Item name="type" label="存储类型" rules={[{ required: true }]} initialValue="local">
            <Select className="萌系圆角" onChange={(v) => setSelectedType(v)}>
              <Select.Option value="local">本地存储</Select.Option>
              <Select.Option value="s3">S3</Select.Option>
              <Select.Option value="oss">阿里云 OSS</Select.Option>
              <Select.Option value="cos">腾讯云 COS</Select.Option>
              <Select.Option value="sftp">SFTP 远程服务器</Select.Option>
              <Select.Option value="onedrive">Microsoft OneDrive</Select.Option>
            </Select>
          </Form.Item>

          <div className="bg-pink-50 p-4 rounded-xl mb-4 border border-pink-100">
            <div className="text-pink-400 font-bold mb-2">存储配置</div>
            {renderConfigFields()}
          </div>

          <Form.Item name="isDefault" label="设为默认" valuePropName="checked" initialValue={false}>
            <Switch className="萌系开关" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block className="萌系圆角 bg-stfreya-pink border-none h-10 text-lg">
              确认添加 🌸
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PolicyManagement;
