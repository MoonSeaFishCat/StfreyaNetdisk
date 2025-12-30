import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Input, Button, Table, Breadcrumb, Tag, Space } from 'antd';
import {
  FileOutlined,
  FolderFilled,
  LockOutlined,
  CloudDownloadOutlined,
  SaveOutlined,
  UserOutlined,
  LeftOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import request from '../utils/request';
import { useAuthStore } from '../store';
import antdGlobal from '../utils/antd';

const ShareView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const fetchShareData = async (pwd?: string) => {
    setLoading(true);
    try {
      const res: any = await request.get(`/share/${token}${pwd ? `?password=${pwd}` : ''}`);
      setShareInfo(res.share);
      setFileInfo(res.file);
      
      if (res.share.hasPassword && !pwd) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
        // 如果是文件夹，获取列表
        if (res.file.is_dir || res.file.IsFolder) {
          fetchFolderList(null, pwd);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsLocked(true);
      } else {
        antdGlobal.message.error('获取分享信息失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderList = async (parentId: number | null, pwd?: string) => {
    try {
      const res: any = await request.get(`/share/${token}/list`, {
        params: {
          password: pwd || password,
          parentId: parentId || undefined
        }
      });
      setFiles(res.data || []);
      if (!currentFolderId) {
        setCurrentFolderId(res.root.ID);
      }
    } catch (err) {
      antdGlobal.message.error('获取列表失败');
    }
  };

  useEffect(() => {
    fetchShareData();
  }, [token]);

  const handleVerify = () => {
    if (!password) {
      antdGlobal.message.warning('请输入提取码');
      return;
    }
    fetchShareData(password);
  };

  const handleFolderClick = (record: any) => {
    if (record.is_dir || record.IsFolder) {
      setCurrentPath([...currentPath, record]);
      setCurrentFolderId(record.ID);
      fetchFolderList(record.ID);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
      setCurrentFolderId(null);
      fetchFolderList(null);
    } else {
      const newPath = currentPath.slice(0, index + 1);
      const lastFolder = newPath[newPath.length - 1];
      setCurrentPath(newPath);
      setCurrentFolderId(lastFolder.ID);
      fetchFolderList(lastFolder.ID);
    }
  };

  const handleDownload = (record?: any) => {
    const targetFile = record || fileInfo;
    const url = `${import.meta.env.VITE_API_BASE_URL}/share/${token}/download?password=${password}&fileId=${targetFile.ID || ''}`;
    window.open(url);
  };

  const handleSaveToMy = async (record?: any) => {
    if (!user) {
      antdGlobal.message.info('请先登录后再保存');
      navigate('/login');
      return;
    }
    try {
      const targetFile = record || fileInfo;
      await request.post(`/share/${token}/save`, {
        password,
        fileId: targetFile.ID,
        targetParentId: 0 // 默认保存到根目录
      });
      antdGlobal.message.success('保存成功！已存入您的网盘根目录');
    } catch (err) {
      antdGlobal.message.error('保存失败');
    }
  };

  if (loading && !shareInfo) {
    return (
      <div className="min-h-screen bg-stfreya-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-stfreya-200 dark:bg-neutral-800 rounded-2xl mb-4" />
          <div className="h-4 w-32 bg-stfreya-100 dark:bg-neutral-900 rounded-full" />
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-stfreya-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="!rounded-3xl shadow-xl border-none p-6 dark:bg-neutral-900 text-center">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 text-3xl mx-auto mb-6">
              <LockOutlined />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">请输入提取码</h2>
            <p className="text-slate-400 dark:text-slate-500 mb-8">该分享已被加密，请输入提取码以继续访问</p>
            
            <Input.Password
              size="large"
              placeholder="请输入 4 位提取码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onPressEnter={handleVerify}
              className="!rounded-xl mb-6 dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
            />
            
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handleVerify}
              className="h-12 !rounded-xl text-lg font-bold"
            >
              提取文件
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => (record.is_dir || record.IsFolder) && handleFolderClick(record)}
        >
          {(record.is_dir || record.IsFolder) ? (
            <FolderFilled className="text-amber-400 text-xl" />
          ) : (
            <FileOutlined className="text-blue-400 text-xl" />
          )}
          <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-stfreya-500 transition-colors">
            {text}
          </span>
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: any) => (record.is_dir || record.IsFolder) ? '-' : (size / 1024 / 1024).toFixed(2) + ' MB',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {!(record.is_dir || record.IsFolder) && (
            <Button 
              type="text" 
              icon={<CloudDownloadOutlined />} 
              onClick={() => handleDownload(record)}
              className="dark:text-slate-400"
            />
          )}
          <Button 
            type="text" 
            icon={<SaveOutlined />} 
            onClick={() => handleSaveToMy(record)}
            className="dark:text-slate-400"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-stfreya-50 dark:bg-neutral-950 p-4 md:p-8 transition-colors duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Info */}
        <Card className="!rounded-3xl shadow-sm border-none dark:bg-neutral-900/50 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 p-2">
            <div className="w-24 h-24 bg-stfreya-100 dark:bg-stfreya-900/20 rounded-2xl flex items-center justify-center text-stfreya-500 text-4xl">
              {fileInfo?.is_dir || fileInfo?.IsFolder ? <FolderFilled /> : <FileOutlined />}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{fileInfo?.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><UserOutlined /> 分享者: {shareInfo?.username || '匿名'}</span>
                <span className="flex items-center gap-1"><EyeOutlined /> 浏览量: {shareInfo?.views}</span>
                {fileInfo?.size > 0 && <span>大小: {(fileInfo.size / 1024 / 1024).toFixed(2)} MB</span>}
                {shareInfo?.expireTime && (
                  <Tag color="orange" className="m-0 dark:border-none">
                    有效期至: {new Date(shareInfo.expireTime).toLocaleDateString()}
                  </Tag>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              {!(fileInfo?.is_dir || fileInfo?.IsFolder) && (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<CloudDownloadOutlined />} 
                  className="h-12 !rounded-xl font-bold px-8"
                  onClick={() => handleDownload()}
                >
                  下载文件
                </Button>
              )}
              <Button 
                size="large" 
                icon={<SaveOutlined />} 
                className="h-12 !rounded-xl font-bold px-8 dark:bg-neutral-800 dark:text-slate-200 dark:border-neutral-700"
                onClick={() => handleSaveToMy()}
              >
                保存到我的网盘
              </Button>
            </div>
          </div>
        </Card>

        {/* Folder Content */}
        {(fileInfo?.is_dir || fileInfo?.IsFolder) && (
          <Card className="!rounded-3xl shadow-sm border-none dark:bg-neutral-900/50 overflow-hidden">
            <div className="p-4 border-b border-slate-50 dark:border-neutral-800 flex items-center gap-4">
              <Button 
                icon={<LeftOutlined />} 
                onClick={() => handleBreadcrumbClick(currentPath.length - 2)}
                disabled={currentPath.length === 0}
                className="dark:bg-neutral-800 dark:text-slate-300 dark:border-neutral-700"
              />
              <Breadcrumb className="dark:text-slate-400">
                <Breadcrumb.Item 
                  className="cursor-pointer hover:text-stfreya-500"
                  onClick={() => handleBreadcrumbClick(-1)}
                >
                  全部文件
                </Breadcrumb.Item>
                {currentPath.map((item, index) => (
                  <Breadcrumb.Item 
                    key={item.ID}
                    className="cursor-pointer hover:text-stfreya-500"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {item.name}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </div>
            <Table
              columns={columns}
              dataSource={files}
              rowKey="ID"
              pagination={false}
              className="dark:ant-table-dark"
            />
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 dark:text-slate-600 text-sm py-8">
          Powered by Stfreya Netdisk • 治愈系云端存储方案
        </div>
      </div>
    </div>
  );
};

export default ShareView;
