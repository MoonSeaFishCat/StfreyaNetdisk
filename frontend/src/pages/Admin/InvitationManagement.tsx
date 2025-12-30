import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, InputNumber, Input } from 'antd';
import { SafetyOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const InvitationManagement: React.FC = () => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [searchText, setSearchText] = useState('');

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/admin/invites');
      setInvitations(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取邀请码列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleGenerate = async () => {
    try {
      await request.post('/admin/invite/generate', { count: generateCount });
      antdGlobal.message.success(`成功生成 ${generateCount} 个邀请码`);
      setIsModalVisible(false);
      fetchInvitations();
    } catch (err) {
      antdGlobal.message.error('生成失败');
    }
  };

  const handleDelete = (id: number) => {
    antdGlobal.modal.confirm({
      title: '删除邀请码',
      content: '确定要删除此邀请码吗？',
      okType: 'danger',
      onOk: async () => {
        try {
          await request.delete(`/admin/invite/${id}`);
          antdGlobal.message.success('已删除');
          fetchInvitations();
        } catch (err) {
          antdGlobal.message.error('删除失败');
        }
      },
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    antdGlobal.message.success('已复制到剪贴板');
  };

  const filteredData = invitations.filter(item => 
    item.Code.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.creatorName && item.creatorName.toLowerCase().includes(searchText.toLowerCase())) ||
    (item.usedByName && item.usedByName.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: <span className="dark:text-slate-300">邀请码</span>,
      dataIndex: 'Code',
      key: 'Code',
      render: (code: string) => (
        <code 
          className="bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded text-stfreya-500 cursor-pointer font-mono"
          onClick={() => copyCode(code)}
        >
          {code}
        </code>
      ),
    },
    {
      title: <span className="dark:text-slate-300">状态</span>,
      dataIndex: 'Status',
      key: 'Status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'red' : 'green'} className="dark:border-none">
          {status === 1 ? '已使用' : '未使用'}
        </Tag>
      ),
    },
    {
      title: <span className="dark:text-slate-300">创建者</span>,
      dataIndex: 'creatorName',
      key: 'creatorName',
      render: (name: string) => <span className="dark:text-slate-400 font-medium">{name || '系统'}</span>,
    },
    {
      title: <span className="dark:text-slate-300">使用者</span>,
      dataIndex: 'usedByName',
      key: 'usedByName',
      render: (name: string) => <span className="dark:text-slate-400 font-medium">{name || '-'}</span>,
    },
    {
      title: <span className="dark:text-slate-300">创建时间</span>,
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (time: string) => <span className="dark:text-slate-400">{new Date(time).toLocaleString()}</span>,
    },
    {
      title: <span className="dark:text-slate-300">操作</span>,
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDelete(record.ID)}
          disabled={record.Status === 1}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stfreya-500 rounded-2xl flex items-center justify-center text-white text-2xl">
            <SafetyOutlined />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">邀请码管理</h2>
            <p className="text-slate-400 dark:text-slate-500">管理全站注册邀请码</p>
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
          className="h-10 !rounded-xl"
        >
          批量生成
        </Button>
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50">
        <div className="mb-4">
          <Input
            placeholder="搜索邀请码、创建者或使用者..."
            prefix={<SearchOutlined className="text-slate-400" />}
            className="w-80 !rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="ID" 
          loading={loading}
          className="dark:ant-table-dark"
          pagination={{
            className: "dark:text-slate-400",
            pageSize: 10,
          }}
        />
      </Card>

      <Modal
        title={<span className="dark:text-slate-200">批量生成邀请码</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleGenerate}
        className="dark:modal-dark"
      >
        <div className="py-4 space-y-4">
          <p className="text-slate-500 dark:text-slate-400">请输入要生成的邀请码数量：</p>
          <InputNumber 
            min={1} 
            max={100} 
            value={generateCount} 
            onChange={val => setGenerateCount(val || 1)}
            className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
          />
        </div>
      </Modal>
    </div>
  );
};

export default InvitationManagement;
