import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Breadcrumb, Dropdown, Upload, Card, Form, Select, Tag, Modal } from 'antd';
import {
  FolderAddOutlined,
  UploadOutlined,
  SearchOutlined,
  MoreOutlined,
  FileOutlined,
  FolderFilled,
  StarOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  VerticalAlignBottomOutlined,
  EditOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';
import antdGlobal from '../../utils/antd';
import { useAuthStore } from '../../store';

const FileList: React.FC = () => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [parentId, setParentId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetFolders, setTargetFolders] = useState<any[]>([]);
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<number | null>(null);
  const [shareForm] = Form.useForm();
  const [shareResult, setShareResult] = useState<{token: string, password?: string} | null>(null);
  const [folderName, setFolderName] = useState('');
  const [searchText, setSearchText] = useState('');

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [fileVersions, setFileVersions] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState<any>(null);

  const fetchFiles = async (pId: number | null = null, keyword: string = '') => {
    setLoading(true);
    try {
      let res: any;
      if (keyword) {
        res = await request.get('/file/search', { params: { keyword } });
      } else {
        res = await request.get('/file/list', { params: { parentId: pId || 0 } });
      }
      setFiles(res.data || []);
    } catch (err) {
      antdGlobal.message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(parentId, searchText);
  }, [parentId, searchText]);

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    antdGlobal.modal.confirm({
      title: '确定要批量删除吗？',
      content: `确定要将选中的 ${selectedRowKeys.length} 个项目移入回收站吗？`,
      okText: '确定',
      okType: 'danger',
      onOk: async () => {
        try {
          await request.post('/file/batch/delete', { ids: selectedRowKeys });
          antdGlobal.message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchFiles(parentId);
        } catch (err) {
          antdGlobal.message.error('批量删除失败');
        }
      },
    });
  };

  const handleBatchDownload = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const res: any = await request.post('/file/batch/download', 
        { ids: selectedRowKeys }, 
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'batch_download.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      antdGlobal.message.error('打包下载失败');
    }
  };

  const showVersions = async (record: any) => {
    setCurrentFile(record);
    try {
      const res: any = await request.get(`/file/versions/${record.ID}`);
      setFileVersions(res.data || []);
      setIsVersionModalOpen(true);
    } catch (err) {
      antdGlobal.message.error('获取版本失败');
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      await request.post(`/file/version/restore/${versionId}`);
      antdGlobal.message.success('版本还原成功');
      setIsVersionModalOpen(false);
      fetchFiles(parentId);
    } catch (err) {
      antdGlobal.message.error('版本还原失败');
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await request.post('/file/create-dir', {
        name: folderName,
        parentId: parentId || 0
      });
      antdGlobal.message.success('文件夹创建成功');
      setFolderName('');
      setIsModalOpen(false);
      fetchFiles(parentId);
    } catch (err) {
      antdGlobal.message.error('文件夹创建失败');
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentId', String(parentId || 0));

    try {
      await request.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      antdGlobal.message.success('文件上传成功');
      fetchFiles(parentId);
    } catch (err) {
      antdGlobal.message.error('文件上传失败');
    }
    return false; // 阻止自动上传
  };

  const handleDelete = (id: number) => {
    antdGlobal.modal.confirm({
      title: '确定要删除吗？',
      content: '文件将被移入回收站',
      okText: '确定',
      okType: 'danger',
      onOk: async () => {
        try {
          await request.delete(`/file/${id}`);
          antdGlobal.message.success('删除成功');
          fetchFiles(parentId);
        } catch (err) {
          antdGlobal.message.error('删除失败');
        }
      },
    });
  };

  const handleRename = (record: any) => {
    let newName = record.name;
    antdGlobal.modal.confirm({
      title: '重命名',
      content: (
        <Input 
          defaultValue={record.name} 
          onChange={e => newName = e.target.value}
          className="mt-4"
        />
      ),
      onOk: async () => {
        if (!newName || newName === record.name) return;
        try {
          await request.put(`/file/rename/${record.ID}`, { name: newName });
          antdGlobal.message.success('重命名成功');
          fetchFiles(parentId);
        } catch (err) {
          antdGlobal.message.error('重命名失败');
        }
      },
    });
  };

  const showMoveModal = async (record: any) => {
    setCurrentFile(record);
    try {
      const res: any = await request.get('/file/list', { params: { parentId: 0 } });
      // 过滤掉当前要移动的文件夹（如果是文件夹的话）及其子文件夹
      const folders = (res.data || []).filter((f: any) => f.is_dir && f.ID !== record.ID);
      setTargetFolders([{ ID: 0, name: '根目录' }, ...folders]);
      setSelectedTargetFolder(0);
      setIsMoveModalOpen(true);
    } catch (err) {
      antdGlobal.message.error('获取文件夹列表失败');
    }
  };

  const handleMove = async () => {
    if (selectedTargetFolder === null) return;
    try {
      if (selectedRowKeys.length > 0) {
        // 批量移动
        await Promise.all(selectedRowKeys.map(id => 
          request.put(`/file/move/${id}`, { parentId: selectedTargetFolder })
        ));
        antdGlobal.message.success(`成功移动 ${selectedRowKeys.length} 个项目`);
        setSelectedRowKeys([]);
      } else if (currentFile) {
        // 单个移动
        await request.put(`/file/move/${currentFile.ID}`, { parentId: selectedTargetFolder });
        antdGlobal.message.success('移动成功');
      }
      setIsMoveModalOpen(false);
      fetchFiles(parentId);
    } catch (err) {
      antdGlobal.message.error('操作失败');
    }
  };

  const showBatchMoveModal = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const res: any = await request.get('/file/list', { params: { parentId: 0 } });
      const folders = (res.data || []).filter((f: any) => f.is_dir && !selectedRowKeys.includes(f.ID));
      setTargetFolders([{ ID: 0, name: '根目录' }, ...folders]);
      setSelectedTargetFolder(0);
      setIsMoveModalOpen(true);
    } catch (err) {
      antdGlobal.message.error('获取文件夹列表失败');
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await request.post(`/file/${id}/favorite`);
      antdGlobal.message.success('操作成功');
      fetchFiles(parentId);
    } catch (err) {
      antdGlobal.message.error('操作失败');
    }
  };

  const handleShare = async (record: any) => {
    setCurrentFile(record);
    setShareResult(null);
    shareForm.resetFields();
    shareForm.setFieldsValue({ expireDays: 7 });
    setIsShareModalOpen(true);
  };

  const submitShare = async (values: any) => {
    try {
      const res: any = await request.post('/file/share', {
        fileId: currentFile.ID,
        password: values.password,
        expireDays: values.expireDays
      });
      setShareResult({
        token: res.token,
        password: values.password
      });
      antdGlobal.message.success('分享成功');
    } catch (err) {
      antdGlobal.message.error('创建分享失败');
    }
  };

  const columns = [
    {
      title: <span className="dark:text-slate-300">名称</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div 
          className="flex items-center gap-3 group cursor-pointer" 
          onClick={() => {
            if (record.is_dir) {
              setParentId(record.ID);
              setCurrentPath([...currentPath, { id: record.ID, name: record.name }]);
            }
          }}
        >
          {record.is_dir ? (
            <FolderFilled className="text-amber-400 text-xl" />
          ) : (
            <FileOutlined className="text-blue-400 text-xl" />
          )}
          <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-stfreya-500 transition-colors">
            {text}
          </span>
          {record.is_favorite && <StarOutlined className="text-amber-400 text-xs" />}
        </div>
      ),
    },
    {
      title: <span className="dark:text-slate-300">大小</span>,
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: any) => (
        <span className="dark:text-slate-400">
          {record.is_dir ? '-' : (size / 1024 / 1024).toFixed(2) + ' MB'}
        </span>
      ),
    },
    {
      title: <span className="dark:text-slate-300">修改时间</span>,
      dataIndex: 'UpdatedAt',
      key: 'UpdatedAt',
      render: (time: string) => (
        <span className="dark:text-slate-400">
          {new Date(time).toLocaleString()}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => {
        const items = [
          { 
            key: 'download', 
            icon: <VerticalAlignBottomOutlined />, 
            label: '下载',
            disabled: record.is_dir,
            onClick: () => window.open(`${import.meta.env.VITE_API_BASE_URL}/file/${record.ID}/preview?token=${useAuthStore.getState().token}`)
          },
          ...(searchText ? [{ 
            key: 'open_location', 
            icon: <FolderOpenOutlined />, 
            label: '打开所在位置', 
            onClick: () => {
              setParentId(record.parent_id);
              setSearchText('');
            }
          }] : []),
          { key: 'share', icon: <ShareAltOutlined />, label: '分享', onClick: () => handleShare(record) },
          { 
            key: 'favorite', 
            icon: <StarOutlined className={record.is_favorite ? 'text-amber-400' : ''} />, 
            label: record.is_favorite ? '取消收藏' : '收藏',
            onClick: () => handleToggleFavorite(record.ID)
          },
          { 
            key: 'versions', 
            icon: <EditOutlined />, 
            label: '历史版本', 
            disabled: record.is_dir,
            onClick: () => showVersions(record) 
          },
          { key: 'move', icon: <FolderOpenOutlined />, label: '移动', onClick: () => showMoveModal(record) },
          { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: () => handleRename(record) },
          { type: 'divider' as const },
          { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: () => handleDelete(record.ID) },
        ];

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined className="dark:text-slate-400" />} />
          </Dropdown>
        );
      },
    },
  ];

  const handleBreadcrumbClick = (id: number | null, index: number) => {
    setParentId(id);
    if (id === null) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800 transition-colors">
        <Breadcrumb 
          className="text-lg"
          items={[
            {
              title: '我的文件',
              className: 'cursor-pointer hover:text-stfreya-500 dark:text-slate-300',
              onClick: () => handleBreadcrumbClick(null, -1)
            },
            ...currentPath.map((p, index) => ({
              title: p.name,
              className: 'cursor-pointer hover:text-stfreya-500 dark:text-slate-300',
              onClick: () => handleBreadcrumbClick(p.id, index)
            }))
          ]}
        />

        <div className="flex gap-2">
          <Input
            placeholder="搜索文件..."
            prefix={<SearchOutlined className="text-slate-400" />}
            className="w-64 !rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {selectedRowKeys.length > 0 && (
            <Space>
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={handleBatchDelete}
                className="!rounded-xl"
              >
                删除 ({selectedRowKeys.length})
              </Button>
              <Button 
                icon={<VerticalAlignBottomOutlined />} 
                onClick={handleBatchDownload}
                className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-300"
              >
                下载
              </Button>
              <Button 
                icon={<FolderOpenOutlined />} 
                onClick={showBatchMoveModal}
                className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-300"
              >
                移动
              </Button>
            </Space>
          )}
          <Upload showUploadList={false} beforeUpload={handleUpload}>
            <Button type="primary" icon={<UploadOutlined />} className="!rounded-xl">上传文件</Button>
          </Upload>
          <Button 
            icon={<FolderAddOutlined />} 
            onClick={() => setIsModalOpen(true)}
            className="!rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-300"
          >
            新建文件夹
          </Button>
        </div>
      </div>

      <Card className="!rounded-3xl border-none shadow-sm dark:bg-neutral-900/50 overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={files} 
          rowKey="ID" 
          loading={loading}
          className="dark:ant-table-dark"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            className: "px-4 dark:text-slate-400",
            pageSize: 10,
          }}
        />
      </Card>

      <Modal
        title={<span className="dark:text-slate-200">新建文件夹</span>}
        open={isModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => setIsModalOpen(false)}
        className="dark:modal-dark"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="mt-4 dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200"
          onPressEnter={handleCreateFolder}
        />
      </Modal>

      <Modal
        title={<span className="dark:text-slate-200">移动到</span>}
        open={isMoveModalOpen}
        onOk={handleMove}
        onCancel={() => setIsMoveModalOpen(false)}
        className="dark:modal-dark"
      >
        <div className="mt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">选择目标文件夹：</p>
          <Select
            className="w-full dark:ant-select-dark"
            value={selectedTargetFolder}
            onChange={setSelectedTargetFolder}
          >
            {targetFolders.map(folder => (
              <Select.Option key={folder.ID} value={folder.ID}>
                {folder.ID === 0 ? <FolderFilled className="text-amber-400 mr-2" /> : <FolderFilled className="text-amber-400 mr-2" />}
                {folder.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

      <Modal
        title={<span className="dark:text-slate-200">历史版本 - {currentFile?.name}</span>}
        open={isVersionModalOpen}
        onCancel={() => setIsVersionModalOpen(false)}
        footer={null}
        width={600}
        className="dark:modal-dark"
      >
        <Table
          dataSource={fileVersions}
          rowKey="ID"
          pagination={false}
          className="mt-4 dark:ant-table-dark"
          columns={[
            {
              title: <span className="dark:text-slate-300">版本时间</span>,
              dataIndex: 'CreatedAt',
              key: 'CreatedAt',
              render: (time: string) => <span className="dark:text-slate-400">{new Date(time).toLocaleString()}</span>
            },
            {
              title: <span className="dark:text-slate-300">大小</span>,
              dataIndex: 'Size',
              key: 'Size',
              render: (size: number) => <span className="dark:text-slate-400">{(size / 1024 / 1024).toFixed(2)} MB</span>
            },
            {
              title: <span className="dark:text-slate-300">操作</span>,
              key: 'action',
              render: (_: any, record: any) => (
                <Button 
                  type="link" 
                  onClick={() => handleRestoreVersion(record.ID)}
                >
                  还原此版本
                </Button>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title={<span className="dark:text-slate-200">创建分享 - {currentFile?.name}</span>}
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        onOk={() => !shareResult && shareForm.submit()}
        okText={shareResult ? "关闭" : "生成链接"}
        cancelButtonProps={{ style: { display: shareResult ? 'none' : 'inline-block' } }}
        className="dark:modal-dark"
        footer={shareResult ? [
          <Button key="close" type="primary" onClick={() => setIsShareModalOpen(false)}>关闭</Button>
        ] : undefined}
      >
        {!shareResult ? (
          <Form form={shareForm} onFinish={submitShare} layout="vertical" className="mt-4">
            <Form.Item name="password" label={<span className="dark:text-slate-300">提取码 (可选)</span>}>
              <Input placeholder="留空则为公开分享" className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200" />
            </Form.Item>
            <Form.Item name="expireDays" label={<span className="dark:text-slate-300">有效期 (天)</span>} rules={[{ required: true }]}>
              <Select className="dark:ant-select-dark">
                <Select.Option value={1}>1天</Select.Option>
                <Select.Option value={7}>7天</Select.Option>
                <Select.Option value={30}>30天</Select.Option>
                <Select.Option value={0}>永久有效</Select.Option>
              </Select>
            </Form.Item>
            <p className="text-xs text-slate-400 dark:text-slate-500">创建分享链接将奖励学园币</p>
          </Form>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-dashed border-slate-200 dark:border-neutral-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">分享链接：</p>
              <Input.TextArea 
                readOnly 
                value={`${window.location.origin}/s/${shareResult.token}`} 
                rows={2}
                className="dark:bg-neutral-900 dark:border-neutral-700 dark:text-stfreya-400 font-mono text-sm"
              />
              {shareResult.password && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">提取码：</span>
                  <Tag color="blue" className="font-mono">{shareResult.password}</Tag>
                </div>
              )}
            </div>
            <Button 
              block 
              onClick={() => {
                const text = `链接: ${window.location.origin}/s/${shareResult.token}${shareResult.password ? ` 提取码: ${shareResult.password}` : ''}`;
                navigator.clipboard.writeText(text);
                antdGlobal.message.success('已复制到剪贴板');
              }}
              className="!rounded-xl"
            >
              复制分享信息
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileList;
