import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Card, Space } from 'antd';
import {
  SearchOutlined,
  FileOutlined,
  FolderFilled,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';

const RecycleBin: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchRecycleBin = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/file/recycle');
      setFiles(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取回收站列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const handleRestore = async (id: number) => {
    try {
      await request.post(`/file/restore/${id}`);
      antdGlobal.message.success('还原成功');
      fetchRecycleBin();
    } catch (err) {
      antdGlobal.message.error('还原失败');
    }
  };

  const handlePermanentDelete = (id: number) => {
    antdGlobal.modal.confirm({
      title: '彻底删除',
      content: '此操作将永久删除该文件，不可找回！',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.delete(`/file/permanent/${id}`);
          antdGlobal.message.success('已永久删除');
          fetchRecycleBin();
        } catch (err) {
          antdGlobal.message.error('删除失败');
        }
      },
    });
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          {record.is_dir ? (
            <FolderFilled className="text-amber-400 text-xl" />
          ) : (
            <FileOutlined className="text-blue-400 text-xl" />
          )}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {text}
          </span>
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: any) => record.is_dir ? '-' : (size / 1024 / 1024).toFixed(2) + ' MB',
    },
    {
      title: '删除时间',
      dataIndex: 'DeletedAt',
      key: 'DeletedAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="text" 
            icon={<ReloadOutlined />} 
            onClick={() => handleRestore(record.ID)}
            title="还原"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handlePermanentDelete(record.ID)}
            title="彻底删除"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stfreya-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50">
            <DeleteOutlined />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 m-0">回收站</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">文件将在一段时间后被自动清理</p>
          </div>
        </div>
        <Input
          prefix={<SearchOutlined className="text-slate-300" />}
          placeholder="搜索已删除的文件..."
          className="w-64 !rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredFiles}
          rowKey="ID"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="dark:ant-table-dark"
        />
      </Card>

      {filteredFiles.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-800 rounded-3xl shadow-sm transition-colors">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=recycle" alt="empty" className="w-32 h-32 opacity-20 mb-4" />
          <p className="text-slate-400">回收站空空如也 ~</p>
        </div>
      )}
    </div>
  );
};

export default RecycleBin;
