import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Tag, Typography, InputNumber, Form } from 'antd';
import { DeleteOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import request from '../../utils/request';

const { Text } = Typography;

const InviteManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const res: any = await request.get('/admin/invites');
      setData(res.data || []);
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleGenerate = async (values: { count: number }) => {
    try {
      setLoading(true);
      await request.post('/admin/invite/generate', values);
      message.success('邀请码生成成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchInvites();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除该邀请码?',
      content: '删除后该邀请码将无法使用。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await request.delete(`/admin/invite/${id}`);
          message.success('邀请码已删除');
          fetchInvites();
        } catch (error) {}
      }
    });
  };

  const columns = [
    {
      title: '邀请码',
      dataIndex: 'Code',
      key: 'Code',
      render: (code: string) => <Text copyable className="font-mono">{code}</Text>,
    },
    {
      title: '生成者',
      dataIndex: 'creatorName',
      key: 'creatorName',
      render: (name: string) => <Tag color="blue">{name || '系统'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'Status',
      render: (status: number, record: any) => (
        status === 1 ? (
          <Tag color="success">已使用 (使用者: {record.usedByName})</Tag>
        ) : (
          <Tag color="processing">未使用</Tag>
        )
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDelete(record.ID)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <KeyOutlined className="text-stfreya-pink" />
          邀请码全量管理
        </h3>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalOpen(true)}
            className="萌系圆角"
          >
            批量生成
          </Button>
          <Button onClick={fetchInvites} loading={loading} className="萌系圆角">刷新</Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        rowKey="ID"
        pagination={{ pageSize: 10 }}
        className="萌系圆角 overflow-hidden border border-gray-100"
      />

      <Modal
        title="批量生成邀请码"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="生成"
        cancelText="取消"
        className="萌系圆角"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ count: 10 }}
          onFinish={handleGenerate}
        >
          <Form.Item
            label="生成数量"
            name="count"
            rules={[{ required: true, message: '请输入生成数量' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} className="萌系圆角" />
          </Form.Item>
          <Text type="secondary">管理员生成的邀请码不消耗学园币。</Text>
        </Form>
      </Modal>
    </div>
  );
};

export default InviteManagement;
