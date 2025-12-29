import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Input, message, Typography, ConfigProvider, theme, Table, Breadcrumb, Space, Tooltip } from 'antd';
import { FileOutlined, DownloadOutlined, LockOutlined, CloudOutlined, FolderFilled, HomeOutlined, SaveOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import { formatBytes } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { motion } from 'framer-motion';

const { Content } = Layout;
const { Title, Text } = Typography;

const ShareView = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [folderFiles, setFolderFiles] = useState<any[]>([]);
  const [path, setPath] = useState<any[]>([]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);

  const fetchShareInfo = async () => {
    try {
      setLoading(true);
      const res: any = await request.get(`/share/info/${token}`);
      setShareInfo(res.share);
      setFileInfo(res.file);
      if (!res.share.hasPassword) {
        setIsVerified(true);
      }
    } catch (error: any) {
      // 错误已由拦截器全局处理
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderFiles = async (parentId: number | null = null) => {
    try {
      setLoading(true);
      const url = `/share/list/${token}?password=${password}${parentId ? `&parentId=${parentId}` : ''}`;
      const res: any = await request.get(url);
      setFolderFiles(res.data);
      if (parentId === null) {
        setPath([{ id: res.root.ID, name: res.root.name }]);
      }
    } catch (error: any) {
      // 错误已由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShareInfo();
  }, [token]);

  useEffect(() => {
    if (isVerified && fileInfo?.isFolder) {
      fetchFolderFiles(currentParentId);
    }
  }, [isVerified, fileInfo, currentParentId]);

  const handleDownload = (record?: any) => {
    const url = `/api/v1/share/download/${token}${password ? `?password=${password}` : ''}${record ? `&fileId=${record.ID}` : ''}`;
    window.open(url, '_blank');
  };

  const handleSaveToMyDisk = async (record?: any) => {
    if (!user) {
      message.info('请先登录后再保存到网盘');
      navigate('/login');
      return;
    }

    try {
      setSaveLoading(true);
      await request.post(`/share/save/${token}`, {
        password,
        parentId: 0, // 默认保存到根目录
        fileId: record?.ID || 0
      });
      message.success('保存成功！已存入您的网盘根目录');
    } catch (error) {
      // 错误由拦截器处理
    } finally {
      setSaveLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!password) {
      message.warning('请输入提取码');
      return;
    }
    try {
      await request.post(`/share/verify/${token}`, { password });
      setIsVerified(true);
      message.success('提取成功');
    } catch (error: any) {
      // 错误已由拦截器全局处理
    }
  };

  const handleFolderClick = (record: any) => {
    setCurrentParentId(record.ID);
    setPath([...path, { id: record.ID, name: record.name }]);
  };

  const handleBreadcrumbClick = (id: number, index: number) => {
    setCurrentParentId(id === path[0].id ? null : id);
    setPath(path.slice(0, index + 1));
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space onClick={() => record.isFolder ? handleFolderClick(record) : null} className={record.isFolder ? "cursor-pointer group" : ""}>
          {record.isFolder ? (
            <FolderFilled className="text-stfreya-blue text-xl group-hover:scale-110 transition-transform" />
          ) : (
            <FileOutlined className="text-stfreya-pink text-xl" />
          )}
          <span className={record.isFolder ? "group-hover:text-stfreya-pink transition-colors" : ""}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: any) => record.isFolder ? '-' : formatBytes(size),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {!record.isFolder && (
            <Button 
              type="link" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)}
            >
              下载
            </Button>
          )}
          <Tooltip title="保存到我的网盘">
            <Button 
              type="link" 
              icon={<SaveOutlined />} 
              loading={saveLoading}
              onClick={() => handleSaveToMyDisk(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ffafcc',
          borderRadius: 16,
        },
      }}
    >
      <Layout className="min-h-screen bg-stfreya-pink/5">
        <Content className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full ${fileInfo?.isFolder && isVerified ? 'max-w-4xl' : 'max-w-md'}`}
          >
            <Card className="萌系圆角 shadow-2xl border-none overflow-hidden">
              <div className="bg-stfreya-pink h-24 flex items-center justify-center">
                 <CloudOutlined className="text-white text-4xl" />
              </div>
              
              <div className="p-6">
                {loading && !folderFiles.length ? (
                  <div className="text-center py-10">加载中...</div>
                ) : !shareInfo ? (
                  <div className="text-center py-10">
                    <Title level={4} className="text-gray-400">分享链接不存在或已过期</Title>
                    <Button type="primary" href="/" className="萌系圆角 mt-4">返回首页</Button>
                  </div>
                ) : !isVerified ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <LockOutlined className="text-stfreya-pink text-5xl mb-4" />
                      <Title level={4}>请输入提取码</Title>
                      <Text type="secondary">该分享受到密码保护，请输入提取码以继续</Text>
                    </div>
                    <Input.Password 
                      placeholder="提取码" 
                      size="large"
                      className="萌系圆角"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onPressEnter={handleVerify}
                    />
                    <Button 
                      type="primary" 
                      block 
                      size="large" 
                      className="萌系圆角 h-12"
                      onClick={handleVerify}
                    >
                      提取文件
                    </Button>
                  </div>
                ) : fileInfo?.isFolder ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Breadcrumb className="mb-4">
                        {path.map((item, index) => (
                          <Breadcrumb.Item 
                            key={item.id} 
                            className="cursor-pointer"
                            onClick={() => handleBreadcrumbClick(item.id, index)}
                          >
                            {index === 0 ? <HomeOutlined /> : item.name}
                          </Breadcrumb.Item>
                        ))}
                      </Breadcrumb>
                      <Text type="secondary">由 {shareInfo.creatorName || '匿名用户'} 分享</Text>
                    </div>
                    <Table 
                      dataSource={folderFiles} 
                      columns={columns} 
                      rowKey="ID" 
                      loading={loading}
                      pagination={false}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="bg-stfreya-pink/10 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                      <FileOutlined className="text-stfreya-pink text-4xl" />
                    </div>
                    <div>
                      <Title level={3} className="mb-1">{fileInfo.name}</Title>
                      <Text type="secondary">{formatBytes(fileInfo.size)}</Text>
                    </div>
                    <div className="pt-4 space-y-3">
                      <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        block 
                        size="large" 
                        className="萌系圆角 h-12"
                        onClick={() => handleDownload()}
                      >
                        立即下载
                      </Button>
                      <Button 
                        icon={<SaveOutlined />} 
                        block 
                        size="large" 
                        className="萌系圆角 h-12"
                        loading={saveLoading}
                        onClick={() => handleSaveToMyDisk()}
                      >
                        保存到我的网盘
                      </Button>
                      <Text type="secondary" className="text-xs">
                        分享者: {shareInfo.creatorName || '匿名用户'} | 
                        浏览次数: {shareInfo.views} | 
                        到期时间: {shareInfo.expireTime ? new Date(shareInfo.expireTime).toLocaleDateString() : '永久有效'}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default ShareView;
