import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Dropdown, Card } from 'antd';
import {
  SearchOutlined,
  HeartOutlined,
  MoreOutlined,
  FileOutlined,
  FolderFilled,
  StarFilled,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';
import { useAuthStore } from '../../store';

const Favorites: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/file/favorites');
      setFiles(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (id: number) => {
    try {
      await request.post(`/file/${id}/favorite`);
      antdGlobal.message.success('已取消收藏');
      fetchFavorites();
    } catch (err) {
      antdGlobal.message.error('操作失败');
    }
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
          <StarFilled className="text-amber-400 text-xs" />
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
      title: '修改时间',
      dataIndex: 'UpdatedAt',
      key: 'UpdatedAt',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              { 
                key: 'download', 
                icon: <VerticalAlignBottomOutlined />, 
                label: '下载',
                disabled: record.is_dir,
                onClick: () => window.open(`${import.meta.env.VITE_API_BASE_URL}/file/${record.ID}/preview?token=${useAuthStore.getState().token}`)
              },
              { 
                key: 'unfavorite', 
                icon: <StarFilled className="text-amber-400" />, 
                label: '取消收藏',
                onClick: () => handleToggleFavorite(record.ID)
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stfreya-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-stfreya-200 dark:shadow-stfreya-900/50">
            <HeartOutlined />
          </div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 m-0">我的收藏</h2>
        </div>
        <Input
          prefix={<SearchOutlined className="text-slate-300" />}
          placeholder="搜索收藏的文件..."
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
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=favorite" alt="empty" className="w-32 h-32 opacity-20 mb-4" />
          <p className="text-slate-400">还没有收藏任何文件呢 ~</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
