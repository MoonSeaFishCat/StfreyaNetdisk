import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Table, Space, Button, message, Typography } from 'antd';
import { 
  FileOutlined, 
  FolderFilled, 
  StarFilled,
  DownloadOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';
import { formatBytes } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';
import { motion } from 'framer-motion';

const { Title } = Typography;

interface FileRecord {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  name: string;
  size: number;
  path: string;
  ext: string;
  isFolder: boolean;
  parentId: number;
}

const Favorites = () => {
  const { token } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<FileRecord[]>([]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/file/favorites');
      setDataSource(res.data);
    } catch (error) {
      // 错误已由拦截器全局处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (record: FileRecord) => {
    try {
      const res: any = await request.post(`/file/favorite/${record.ID}`);
      message.success(res.message);
      fetchFavorites(); // 刷新列表，被取消收藏的会消失
    } catch (error) {
      // 错误已由拦截器处理
    }
  };

  const handleDownload = (record: FileRecord) => {
    const url = `/api/v1/file/preview/${record.ID}?token=${token}`;
    window.open(url, '_blank');
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileRecord) => (
        <Space className="group w-full">
          {record.isFolder ? (
            <FolderFilled className="text-stfreya-blue text-xl mr-2" />
          ) : (
            <FileOutlined className="text-stfreya-pink text-xl mr-2" />
          )}
          <span className="font-medium">
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: FileRecord) => record.isFolder ? '-' : formatBytes(size),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileRecord) => (
        <Space size="middle">
          {!record.isFolder && (
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)}
            />
          )}
          <Button 
            type="text" 
            icon={<StarFilled className="text-yellow-400" />} 
            onClick={() => handleToggleFavorite(record)}
            title="取消收藏"
          />
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Title level={2} className="!mb-0 flex items-center">
            <StarFilled className="text-yellow-400 mr-3" />
            我的收藏
          </Title>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Table 
            columns={columns} 
            dataSource={dataSource} 
            loading={loading}
            rowKey="ID"
            className="萌系圆角 shadow-sm overflow-hidden"
          />
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Favorites;
