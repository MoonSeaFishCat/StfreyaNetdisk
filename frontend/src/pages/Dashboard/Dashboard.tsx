import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Table, Space, Button, Input, Breadcrumb, Dropdown, type MenuProps, Modal, message, Upload, Select, List, notification } from 'antd';
import { 
  FileOutlined, 
  FolderFilled, 
  SearchOutlined, 
  UploadOutlined, 
  PlusOutlined,
  CloudDownloadOutlined,
  MoreOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  SaveOutlined,
  HistoryOutlined,
  StarFilled,
  StarOutlined
} from '@ant-design/icons';
import Editor from "@monaco-editor/react";
import request from '../../utils/request';
import { formatBytes } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';

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
  IsFavorite?: boolean;
}

const Dashboard = () => {
  const { token } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<FileRecord[]>([]);
  const [currentParentId, setCurrentParentId] = useState(0);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [shareToken, setShareToken] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpireDays, setShareExpireDays] = useState(7);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveDestId, setMoveDestId] = useState<number>(0);
  const [folders, setFolders] = useState<FileRecord[]>([]);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [fileVersions, setFileVersions] = useState<any[]>([]);
  const [currentFileForVersion, setCurrentFileForVersion] = useState<FileRecord | null>(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchFiles = async (parentId: number, searchKeyword?: string) => {
    setLoading(true);
    try {
      const url = searchKeyword 
        ? `/file/search?keyword=${searchKeyword}`
        : `/file/list?parentId=${parentId}`;
      const res: any = await request.get(url);
      setDataSource(res.data);
    } catch (error) {
      // 错误已由拦截器全局处理
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchFiles(currentParentId, searchText);
  };

  const handleRename = async () => {
    if (!selectedFile || !renameName) return;
    try {
      await request.put(`/file/rename/${selectedFile.ID}`, { name: renameName });
      message.success('重命名成功');
      setIsRenameModalOpen(false);
      fetchFiles(currentParentId);
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handleMove = async () => {
    if (!selectedFile) return;
    try {
      await request.put(`/file/move/${selectedFile.ID}`, { parentId: moveDestId });
      message.success('移动成功');
      setIsMoveModalOpen(false);
      fetchFiles(currentParentId);
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const fetchFolders = async () => {
    try {
      const res: any = await request.get('/file/list?parentId=0'); // 简化版：只列出根目录文件夹
      setFolders(res.data.filter((f: FileRecord) => f.isFolder));
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  useEffect(() => {
    fetchFiles(currentParentId);
  }, [currentParentId]);

  const handleFolderClick = (record: FileRecord) => {
    if (record.isFolder) {
      setCurrentParentId(record.ID);
      setBreadcrumb([...breadcrumb, { id: record.ID, name: record.name }]);
    }
  };

  const handleBreadcrumbClick = (id: number, index: number) => {
    setCurrentParentId(id);
    setBreadcrumb(breadcrumb.slice(0, index + 1));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      await request.post('/file/folder', {
        parentId: currentParentId,
        name: newFolderName
      });
      message.success('创建文件夹成功');
      setIsModalOpen(false);
      setNewFolderName('');
      fetchFiles(currentParentId);
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文件/文件夹吗？',
      onOk: async () => {
        try {
          await request.delete(`/file/${id}`);
          message.success('删除成功');
          fetchFiles(currentParentId);
        } catch (error) {
          // 错误已由拦截器全局处理
        }
      }
    });
  };

  const handleShare = async () => {
    if (!selectedFile) return;
    try {
      const res: any = await request.post('/file/share', {
        fileId: selectedFile.ID,
        password: sharePassword,
        expireDays: shareExpireDays
      });
      setShareToken(res.token);
      message.success('分享链接已生成');
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handleBatchDownload = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const response: any = await request.post('/file/batch/download', { ids: selectedRowKeys }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'batch_download.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要将选中的 ${selectedRowKeys.length} 个项目移入回收站吗？`,
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => request.delete(`/file/${id}`)));
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchFiles(currentParentId);
        } catch (error) {
          // 错误已由拦截器全局处理
        }
      }
    });
  };

  const isVideo = (ext: string) => {
    return ['.mp4', '.webm', '.ogg'].includes(ext.toLowerCase());
  };

  const handlePreview = async (record: FileRecord) => {
    if (record.isFolder) return;
    setSelectedFile(record);
    const url = `/api/v1/file/preview/${record.ID}?token=${token}`;
    
    if (record.ext === '.txt' || record.ext === '.md' || record.ext === '.json' || record.ext === '.js' || record.ext === '.go') {
      try {
        const res = await request.get(`/file/preview/${record.ID}`, { responseType: 'text' });
        setEditContent(res as any);
        setIsEditing(false);
      } catch (error) {
        // 错误已由拦截器全局处理
      }
    }
    
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      await request.post(`/file/save/${selectedFile.ID}`, { content: editContent });
      message.success('保存成功');
      setIsEditing(false);
      fetchFiles(currentParentId);
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handleShowVersions = async (file: FileRecord) => {
    setCurrentFileForVersion(file);
    try {
      const res = await request.get(`/file/versions/${file.ID}`);
      setFileVersions(res.data.data);
      setVersionModalVisible(true);
    } catch (error) {
      // 错误已由拦截器全局处理
    }
  };

  const handleCopyWebDAV = () => {
    const url = `${window.location.protocol}//${window.location.hostname}:8080/webdav`;
    navigator.clipboard.writeText(url);
    Modal.info({
      title: 'WebDAV 信息',
      content: (
        <div>
          <p>WebDAV 地址已复制到剪贴板:</p>
          <Input value={url} readOnly className="萌系圆角 mt-2" />
          <p className="mt-4 text-gray-500 text-sm">请使用您的用户名和密码进行登录。</p>
        </div>
      )
    });
  };

  const handleRestoreVersion = async (versionId: number) => {
    Modal.confirm({
      title: '确认还原版本',
      content: '还原后当前文件内容将被该版本覆盖，确定吗？',
      onOk: async () => {
        try {
          await request.post(`/file/version/restore/${versionId}`);
          message.success('还原成功');
          setVersionModalVisible(false);
          fetchFiles(currentParentId);
        } catch (error) {
          // 错误已由拦截器全局处理
        }
      }
    });
  };

  const getLanguage = (ext: string) => {
    switch (ext) {
      case '.js': return 'javascript';
      case '.ts': return 'typescript';
      case '.json': return 'json';
      case '.md': return 'markdown';
      case '.go': return 'go';
      case '.html': return 'html';
      case '.css': return 'css';
      default: return 'plaintext';
    }
  };

  const calculateHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const uploadProps = {
    name: 'file',
    action: '/api/v1/file/upload',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    async data(file: any) {
      const hash = await calculateHash(file);
      return {
        parentId: currentParentId,
        hash: hash,
      };
    },
    onChange(info: any) {
      if (info.file.status === 'uploading') {
        setLoading(true);
      }
      if (info.file.status === 'done') {
        setLoading(false);
        message.success(`${info.file.name} 上传成功`);
        fetchFiles(currentParentId);
      } else if (info.file.status === 'error') {
        setLoading(false);
        notification.error({
          message: '上传失败',
          description: `${info.file.name} 上传失败，请检查网络或文件大小限制。`,
        });
      }
    },
    showUploadList: false,
  };

  const getActionMenu = (record: FileRecord): MenuProps['items'] => [
    { key: 'download', label: '下载', icon: <DownloadOutlined /> },
    { 
      key: 'share', 
      label: '分享', 
      icon: <ShareAltOutlined />,
      onClick: () => {
        setSelectedFile(record);
        setShareModalVisible(true);
        setShareToken('');
      }
    },
    { 
      key: 'rename', 
      label: '重命名', 
      icon: <EditOutlined />,
      onClick: () => {
        setSelectedFile(record);
        setRenameName(record.name);
        setIsRenameModalOpen(true);
      }
    },
    { 
      key: 'move', 
      label: '移动', 
      icon: <PlusOutlined />, // 暂时用PlusOutlined代替移动图标
      onClick: () => {
        setSelectedFile(record);
        fetchFolders();
        setIsMoveModalOpen(true);
      }
    },
    {
      key: 'versions',
      label: '历史版本',
      icon: <HistoryOutlined />,
      onClick: () => handleShowVersions(record)
    },
    { 
      key: 'delete', 
      label: '删除', 
      icon: <DeleteOutlined />, 
      danger: true,
      onClick: () => handleDelete(record.ID)
    },
  ];

  const handleToggleFavorite = async (record: FileRecord) => {
    try {
      const res: any = await request.post(`/file/favorite/${record.ID}`);
      message.success(res.message);
      fetchFiles(currentParentId);
    } catch (error) {
      // 错误已由拦截器处理
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileRecord) => (
        <Space className="group w-full">
          <div 
            onClick={() => record.isFolder ? handleFolderClick(record) : handlePreview(record)} 
            className="cursor-pointer flex items-center flex-1"
          >
            {record.isFolder ? (
              <FolderFilled className="text-stfreya-blue text-xl group-hover:scale-110 transition-transform mr-2" />
            ) : (
              <FileOutlined className="text-stfreya-pink text-xl group-hover:scale-110 transition-transform mr-2" />
            )}
            <span className="group-hover:text-stfreya-pink transition-colors font-medium">
              {text}
            </span>
          </div>
          <div onClick={() => handleToggleFavorite(record)} className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            {record.IsFavorite ? (
              <StarFilled className="text-yellow-400" />
            ) : (
              <StarOutlined className="text-gray-300 hover:text-yellow-400" />
            )}
          </div>
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
      title: '修改时间', 
      dataIndex: 'UpdatedAt', 
      key: 'UpdatedAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileRecord) => (
        <Space size="middle">
          {!record.isFolder && (
            <Button type="text" icon={<DownloadOutlined />} className="text-stfreya-pink hover:bg-stfreya-pink/10" />
          )}
          <Button 
            type="text" 
            icon={<ShareAltOutlined />} 
            className="text-stfreya-blue hover:bg-stfreya-blue/10" 
            onClick={() => {
              setSelectedFile(record);
              setShareModalVisible(true);
              setShareToken('');
            }}
          />
          <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* 工具栏 */}
        <div className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/20">
          <Space size="middle">
            <Input
              placeholder="搜索文件..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              className="w-64 rounded-xl border-stfreya-pink/20 focus:border-stfreya-pink focus:shadow-none"
            />
            <Button 
              icon={<SearchOutlined />} 
              onClick={handleSearch}
              className="rounded-xl border-stfreya-pink text-stfreya-pink hover:bg-stfreya-pink/5"
            >
              搜索
            </Button>
          </Space>
          <Space size="middle">
            {selectedRowKeys.length > 0 ? (
              <Space>
                <span className="text-stfreya-pink font-medium">已选中 {selectedRowKeys.length} 项</span>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleBatchDownload}
                  className="萌系圆角 border-stfreya-pink text-stfreya-pink"
                >
                  批量下载
                </Button>
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={handleBatchDelete}
                  className="萌系圆角"
                >
                  批量删除
                </Button>
                <Button onClick={() => setSelectedRowKeys([])} className="萌系圆角">取消选择</Button>
              </Space>
            ) : (
              <>
                <Upload {...uploadProps}>
                  <Button type="primary" icon={<UploadOutlined />} className="萌系圆角 h-10 px-6 shadow-md border-none bg-stfreya-pink hover:bg-stfreya-pink/80">
                    上传文件
                  </Button>
                </Upload>
                <Button 
                  icon={<PlusOutlined />} 
                  className="萌系圆角 h-10 border-stfreya-blue text-stfreya-blue hover:text-stfreya-blue/80 hover:border-stfreya-blue/80"
                  onClick={() => setIsModalOpen(true)}
                >
                  新建文件夹
                </Button>
                <Button icon={<CloudDownloadOutlined />} className="萌系圆角 h-10 text-gray-500">
                  离线下载
                </Button>
                <Button 
                  icon={<ShareAltOutlined />} 
                  className="萌系圆角 h-10 border-stfreya-pink text-stfreya-pink"
                  onClick={handleCopyWebDAV}
                >
                  WebDAV
                </Button>
              </>
            )}
          </Space>
        </div>

        {/* 路径导航 */}
        <div className="flex items-center gap-2 px-2">
           <Breadcrumb
            items={[
                { 
                  title: (
                    <Space onClick={() => { setCurrentParentId(0); setBreadcrumb([]); }} className="cursor-pointer hover:text-stfreya-pink">
                      <HomeOutlined />
                      <span>全部文件</span>
                    </Space>
                  ) 
                },
                ...breadcrumb.map((item, index) => ({
                  title: (
                    <span 
                      key={item.id} 
                      className="cursor-pointer hover:text-stfreya-pink"
                      onClick={() => handleBreadcrumbClick(item.id, index)}
                    >
                      {item.name}
                    </span>
                  )
                }))
            ]}
            />
        </div>

        {/* 文件列表 */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <Table 
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            columns={columns} 
            dataSource={dataSource} 
            loading={loading}
            pagination={false}
            rowKey="ID"
            className="萌系表格"
          />
        </div>

        <Modal
          title="新建文件夹"
          open={isModalOpen}
          onOk={handleCreateFolder}
          onCancel={() => setIsModalOpen(false)}
          okText="创建"
          cancelText="取消"
          className="萌系圆角"
        >
          <Input 
            placeholder="请输入文件夹名称" 
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="萌系圆角 mt-4"
          />
        </Modal>

        <Modal
          title="分享文件"
          open={shareModalVisible}
          onOk={handleShare}
          onCancel={() => setShareModalVisible(false)}
          okText={shareToken ? "确定" : "生成链接"}
          cancelText="取消"
          className="萌系圆角"
          footer={shareToken ? [
            <Button key="close" onClick={() => setShareModalVisible(false)} className="萌系圆角">关闭</Button>,
            <Button key="copy" type="primary" className="萌系圆角 bg-stfreya-pink border-none" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
              message.success('链接已复制到剪贴板');
            }}>复制链接</Button>
          ] : undefined}
        >
          {shareToken ? (
            <div className="mt-4 p-4 bg-stfreya-pink/5 rounded-2xl border border-stfreya-pink/20">
              <div className="text-sm text-gray-500 mb-2">分享链接已生成：</div>
              <Input 
                value={`${window.location.origin}/share/${shareToken}`} 
                readOnly 
                className="萌系圆角 bg-white"
              />
              {sharePassword && (
                <div className="mt-2 text-sm text-gray-500">
                  提取码：<span className="font-bold text-stfreya-pink">{sharePassword}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">分享文件</div>
                <div className="font-medium text-base">{selectedFile?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">有效期</div>
                <Select 
                  defaultValue={7} 
                  className="w-full 萌系圆角"
                  onChange={(val) => setShareExpireDays(val)}
                  options={[
                    { value: 1, label: '1天' },
                    { value: 7, label: '7天' },
                    { value: 30, label: '30天' },
                    { value: 0, label: '永久' },
                  ]}
                />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">提取码 (可选)</div>
                <Input 
                  placeholder="留空则公开访问" 
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  className="萌系圆角"
                />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title={
            <div className="flex items-center justify-between pr-8">
              <span>预览: {selectedFile?.name}</span>
              {selectedFile?.ext.match(/\.(txt|md|json|js|go|html|css)$/i) && (
                <Space>
                  {isEditing ? (
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<SaveOutlined />} 
                      onClick={handleSave}
                      className="萌系圆角 bg-stfreya-blue border-none"
                    >
                      保存
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      icon={<EditOutlined />} 
                      onClick={() => setIsEditing(true)}
                      className="萌系圆角 border-stfreya-blue text-stfreya-blue"
                    >
                      编辑
                    </Button>
                  )}
                </Space>
              )}
            </div>
          }
          open={previewVisible}
          onCancel={() => {
            setPreviewVisible(false);
            setIsEditing(false);
          }}
          footer={null}
          width={1000}
          className="萌系圆角 preview-modal"
          centered
        >
          <div className="flex flex-col items-center justify-center p-4 min-h-[400px]">
            {selectedFile?.ext.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewUrl} alt={selectedFile?.name} className="max-w-full max-h-[600px] rounded-xl shadow-lg" />
            ) : isVideo(selectedFile?.ext || '') ? (
              <video 
                src={previewUrl} 
                controls 
                autoPlay
                className="max-w-full max-h-[600px] rounded-xl shadow-lg bg-black" 
              >
                您的浏览器不支持视频播放。
              </video>
            ) : selectedFile?.ext === '.pdf' ? (
              <iframe src={previewUrl} className="w-full h-[600px] border-none" />
            ) : selectedFile?.ext.match(/\.(txt|md|json|js|go|html|css)$/i) ? (
              <div className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                <Editor
                  height="100%"
                  defaultLanguage={getLanguage(selectedFile?.ext || '')}
                  value={editContent}
                  onChange={(value) => setEditContent(value || '')}
                  options={{
                    readOnly: !isEditing,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'Fira Code, monospace',
                    theme: 'vs-light',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            ) : (
              <div className="text-center">
                <FileOutlined className="text-6xl text-stfreya-pink mb-4" />
                <div className="text-lg">该文件类型暂不支持预览</div>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  className="mt-4 萌系圆角 bg-stfreya-pink border-none"
                  onClick={() => window.open(previewUrl.replace('preview', 'download'), '_blank')}
                >
                  下载查看
                </Button>
              </div>
            )}
          </div>
        </Modal>
        {/* 重命名弹窗 */}
        <Modal
          title="重命名"
          open={isRenameModalOpen}
          onOk={handleRename}
          onCancel={() => setIsRenameModalOpen(false)}
          okText="确认"
          cancelText="取消"
        >
          <Input 
            value={renameName} 
            onChange={(e) => setRenameName(e.target.value)} 
            placeholder="请输入新名称"
            className="rounded-xl border-stfreya-pink/20"
          />
        </Modal>

        {/* 历史版本弹窗 */}
        <Modal
          title={`历史版本: ${currentFileForVersion?.name}`}
          open={versionModalVisible}
          onCancel={() => setVersionModalVisible(false)}
          footer={null}
          width={600}
          className="萌系圆角"
        >
          <List
            dataSource={fileVersions}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    icon={<HistoryOutlined />}
                    onClick={() => handleRestoreVersion(item.ID)}
                    className="text-stfreya-blue"
                  >
                    还原此版本
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={new Date(item.CreatedAt).toLocaleString()}
                  description={`大小: ${formatBytes(item.Size)}`}
                />
              </List.Item>
            )}
          />
        </Modal>

        {/* 移动文件弹窗 */}
        <Modal
          title="移动到"
          open={isMoveModalOpen}
          onOk={handleMove}
          onCancel={() => setIsMoveModalOpen(false)}
          okText="移动"
          cancelText="取消"
        >
          <Select
            placeholder="选择目标文件夹"
            className="w-full rounded-xl"
            onChange={(value) => setMoveDestId(value)}
          >
            <Select.Option value={0}>根目录</Select.Option>
            {folders.map(f => (
              <Select.Option key={f.ID} value={f.ID}>{f.name}</Select.Option>
            ))}
          </Select>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
