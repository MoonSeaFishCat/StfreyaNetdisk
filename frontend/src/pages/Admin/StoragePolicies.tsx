import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Select, Steps, Space, Tag } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const { Option } = Select;

interface StoragePolicy {
  ID: number;
  Name: string;
  Type: string;
  Config: string;
  IsDefault: boolean;
  Status: number;
  BaseURL: string;
}

const StoragePolicies: React.FC = () => {
  const [policies, setPolicies] = useState<StoragePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/policies');
      setPolicies(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDelete = (id: number) => {
    antdGlobal.modal.confirm({
      title: '删除策略',
      content: '确定要删除此存储策略吗？如果该策略下已有文件，删除后这些文件将无法访问！',
      okType: 'danger',
      onOk: async () => {
        try {
          await request.delete(`/admin/policy/${id}`);
          antdGlobal.message.success('删除成功');
          fetchPolicies();
        } catch (err) {
          antdGlobal.message.error('删除失败');
        }
      },
    });
  };

  const handleSetDefault = async (id: number) => {
    try {
      await request.post(`/admin/policy/${id}/default`);
      antdGlobal.message.success('设置成功');
      fetchPolicies();
    } catch (err) {
      antdGlobal.message.error('设置失败');
    }
  };

  const typeIcons: Record<string, any> = {
    local: <DatabaseOutlined className="text-blue-500" />,
    oss: <CloudServerOutlined className="text-orange-500" />,
    s3: <GlobalOutlined className="text-indigo-500" />,
    cos: <CloudServerOutlined className="text-blue-400" />,
    onedrive: <RocketOutlined className="text-blue-600" />
  };

  const columns = [
    {
      title: <span className="dark:text-slate-300">策略名称</span>,
      dataIndex: 'Name',
      key: 'Name',
      render: (text: string, record: StoragePolicy) => (
        <Space>
          {typeIcons[record.Type] || <DatabaseOutlined />}
          <span className="font-medium dark:text-slate-200">{text}</span>
          {record.IsDefault && <Tag color="green">默认</Tag>}
        </Space>
      ),
    },
    {
      title: <span className="dark:text-slate-300">存储类型</span>,
      dataIndex: 'Type',
      key: 'Type',
      render: (type: string) => (
        <Tag className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-300">
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: <span className="dark:text-slate-300">操作</span>,
      key: 'action',
      render: (_: any, record: StoragePolicy) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/admin/policies/edit/${record.ID}`)}
            className="dark:text-slate-400 dark:hover:text-stfreya-400"
          >
            编辑
          </Button>
          {!record.IsDefault && (
            <Button 
              type="text" 
              onClick={() => handleSetDefault(record.ID)}
              className="dark:text-slate-400 dark:hover:text-green-400"
            >
              设为默认
            </Button>
          )}
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.ID)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stfreya-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50">
            <DatabaseOutlined />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 m-0">存储策略</h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm m-0">管理文件的存储位置与访问方式</p>
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => navigate('/admin/policies/new')}
          className="!rounded-2xl bg-stfreya-500 hover:bg-stfreya-600 border-none shadow-lg shadow-stfreya-200 dark:shadow-none h-12 px-6"
        >
          添加策略
        </Button>
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={policies} 
          rowKey="ID" 
          loading={loading}
          pagination={false}
          className="dark:ant-table-dark"
        />
      </Card>
    </div>
  );
};

export default StoragePolicies;
