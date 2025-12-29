import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Table, Space, Button, Modal, message, Card } from 'antd';
import { 
  FileOutlined, 
  FolderFilled, 
  DeleteOutlined,
  UndoOutlined,
  RestOutlined
} from '@ant-design/icons';
import request from '../../utils/request';
import { formatBytes } from '../../utils/format';

interface FileRecord {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string;
  name: string;
  size: number;
  path: string;
  ext: string;
  isFolder: boolean;
  parentId: number;
}

const RecycleBin = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<FileRecord[]>([]);

  const fetchRecycleBin = async () => {
    setLoading(true);
    try {
      setLoading(true);
      const res: any = await request.get('/file/recycle-bin');
      setDataSource(res.data);
    } catch (error) {
      // 错误已由拦截器全局处理
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
      message.success('还原成功');
      fetchRecycleBin();
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handlePermanentDelete = async (id: number) => {
    Modal.confirm({
      title: '确认彻底删除',
      content: '彻底删除后将无法恢复，确定吗？',
      onOk: async () => {
        try {
          await request.delete(`/file/permanent/${id}`);
          message.success('彻底删除成功');
          fetchRecycleBin();
        } catch (error) {
          // 错误已由拦截器全局处理
        }
      }
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileRecord) => (
        <Space>
          {record.isFolder ? (
            <FolderFilled className="text-stfreya-blue text-xl" />
          ) : (
            <FileOutlined className="text-stfreya-pink text-xl" />
          )}
          <span>{text}</span>
        </Space>
      ),
    },
    { 
      title: '大小', 
      dataIndex: 'size', 
      key: 'size', 
      render: (size: number, record: FileRecord) => record.isFolder ? '-' : formatBytes(size)
    },
    { 
      title: '删除时间', 
      dataIndex: 'DeletedAt', 
      key: 'DeletedAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileRecord) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<UndoOutlined />} 
            className="text-stfreya-blue hover:bg-stfreya-blue/10"
            onClick={() => handleRestore(record.ID)}
          >
            还原
          </Button>
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            danger
            className="hover:bg-red-50"
            onClick={() => handlePermanentDelete(record.ID)}
          >
            彻底删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/20">
          <div className="flex items-center gap-3">
            <RestOutlined className="text-2xl text-stfreya-pink" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white m-0">回收站</h2>
          </div>
          <p className="text-gray-500 m-0">已删除的文件会在此保留，您可以选择还原或彻底删除。</p>
        </div>

        <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <Table 
            dataSource={dataSource} 
            columns={columns} 
            loading={loading}
            rowKey="ID"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default RecycleBin;
