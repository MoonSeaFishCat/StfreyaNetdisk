# StfreyaNetdisk 系统设计方案

## 1. 系统架构
采用前后端分离架构：
- **前端**: React + Vite + Ant Design + Tailwind CSS
- **后端**: Golang (Gin 框架) + GORM (ORM)
- **数据库**: MySQL 5.7 (元数据存储)
- **缓存**: Redis (Session, 验证码, 频率限制)
- **对象存储适配层**: 抽象驱动接口，支持 S3, OSS, COS, OneDrive, SFTP, 本地存储等。

## 2. 数据库设计 (核心表)

### 2.1 用户与权限
- `users`: 用户信息 (ID, 用户名, 密码哈希, 邮箱, 角色, 余额/学园币, 总空间, 已用空间)
- `storage_policies`: 存储策略 (ID, 名称, 类型, 配置JSON)
- `user_storage_configs`: 用户存储关联 (用户ID, 存储策略ID)

### 2.2 文件系统
- `files`: 文件元数据 (ID, 名称, 大小, 哈希, 存储路径, 存储策略ID, 创建者ID, 扩展名, 是否为文件夹, 父目录ID)
- `shares`: 分享链接 (ID, 文件ID, 创建者ID, 提取码, 过期时间, 访问次数, 分享类型)

### 2.3 经济系统
- `invitation_codes`: 邀请码 (ID, 代码, 创建者ID, 使用者ID, 状态, 消耗学园币)
- `transactions`: 账单流水 (ID, 用户ID, 类型, 金额, 备注)

## 3. 核心功能模块

### 3.1 存储抽象层 (Storage Driver)
针对不同存储提供商，实现统一的 `Driver` 接口：
- **Local**: 本地磁盘存储。
- **S3/OSS/COS**: 使用各厂商 SDK，支持预签名 URL 提高性能。
- **OneDrive**: 通过 Microsoft Graph API，支持大文件分片上传。
- **SFTP**: 基于 `github.com/pkg/sftp` 实现。

接口定义扩展：
- `Put(ctx context.Context, path string, reader io.Reader, size int64) error`
- `Get(ctx context.Context, path string) (io.ReadCloser, error)`
- `Delete(ctx context.Context, path string) error`
- `GetLink(ctx context.Context, path string, expires time.Duration) (string, error)` (生成分享链接)

### 3.2 文件管理与进阶操作
- **Web 端操作系统体验 (参考可道云)**:
  - **拖拽支持**: 支持文件/文件夹拖拽移动、拖拽上传。
  - **快捷键**: 支持 Ctrl+C/V (复制粘贴), F2 (重命名), Del (删除)。
  - **多任务并进**: 支持同时开启多个预览窗口或任务进度窗。
- **文件版本控制**: 对同名文件覆盖上传时自动保留旧版本 (可选开启)。
- **回收站机制**: 逻辑删除文件，支持一键还原或彻底清空，防止误删。
- **离线下载 (参考 Cloudreve)**: 
  - 集成 `Aria2`，支持 HTTP/HTTPS/磁力链接/种子离线下载至网盘。

### 3.3 预览、处理与 WebDAV
- **图像处理**: 自动生成缩略图 (Image Magick/Sharp)，减轻前端加载压力。
- **WebDAV 支持**: 允许用户通过第三方客户端 (如 Raidrive, PotPlayer) 直接挂载网盘。
- **全文检索**: 集成 `Bleve` 或 `ElasticSearch`，支持对文档内容、标签进行快速搜索。

### 3.4 深度定制经济系统 (Stfreya Ecosystem)
- **学园币 (Stfreya Coin) 进阶用法**:
  - **等级特权**: 消耗学园币升级用户组，解锁更大的单文件上传限制、专属存储桶或 WebDAV 功能。
  - **任务系统**: 完善签到、上传任务、分享任务获取学园币的逻辑。
- **邀请与返利**: 被邀请人充值或获取币时，邀请人可获得一定比例返利。

### 3.5 管理员全局控制
- **存储策略组**: 支持将多个存储桶 (如 S3 + 本地) 聚合成一个策略组，按需动态分配。
- **用户组权限控制 (ACL)**: 精细化控制上传下载速度、存储空间、是否允许分享、是否允许离线下载等。
- **自定义外观**: 管理员可修改站点名称、Logo、背景图、公告等。

### 3.5 安全与性能
- **认证**: JWT + Redis 黑名单，支持多端登录管理。
- **加密**: 敏感存储配置 (如 AccessKey) 在数据库中加密存储。
- **限流**: 基于令牌桶算法，防止 API 恶意攻击。
- **缓存**: 文件列表、用户信息等高频数据缓存至 Redis。

## 4. 关键 API 设计 (RESTful)

### 4.1 用户与认证
- `POST /api/v1/auth/register`: 注册 (支持邀请码)
- `POST /api/v1/auth/login`: 登录 (支持验证码)
- `GET /api/v1/user/info`: 获取当前用户信息
- `POST /api/v1/user/checkin`: 每日签到

### 4.2 文件操作
- `GET /api/v1/file/list`: 列出目录文件
- `POST /api/v1/file/upload`: 文件上传 (分片/秒传)
- `GET /api/v1/file/download/:id`: 文件下载
- `POST /api/v1/file/share`: 创建分享链接
- `GET /api/v1/file/preview/:id`: 获取预览地址

### 4.3 管理员功能
- `POST /api/v1/admin/storage/policy`: 管理存储策略
- `GET /api/v1/admin/users`: 用户列表管理
- `POST /api/v1/admin/invitation/generate`: 批量生成邀请码

## 6. 前端 UI 与交互设计

### 6.1 核心页面布局与 UI 风格
- **萌系治愈风 (Stfreya Theme)**:
  - **配色方案**: 浅色模式采用马卡龙色系 (樱花粉、天空蓝、薄荷绿)；深色模式采用柔和的深紫灰，避免纯黑带来的压抑感。
  - **视觉元素**: 圆角设计 (Large Border Radius)、微交互动画 (Framer Motion)、可爱的小图标 (如圣芙蕾雅学园元素)。
  - **主题切换**: 支持一键切换黑夜/白天模式，支持随系统自动切换。
- **侧边栏 (Sidebar)**: 
  - 全部文件、我的分享、回收站。
  - 存储类别筛选 (视频、图片、文档、音频)。
  - 容量进度条 (已用/总计)。
- **导航栏 (Navbar)**: 
  - 搜索框 (支持文件名、类型搜索)。
  - 用户头像、余额 (学园币) 显示。
  - 通知中心。
- **文件列表 (File List)**: 
  - 支持列表/网格切换。
  - 右键菜单 (下载、分享、重命名、移动、删除、详情)。
  - 多选操作栏 (批量下载、批量删除)。

### 6.2 状态管理与数据流
- **Zustand/Redux**: 维护全局状态 (用户信息、当前目录、上传队列)。
- **React Query**: 处理 API 请求缓存、分页与自动刷新。
- **Axios**: 封装统一的请求拦截器 (处理 JWT 自动注入与错误提示)。

### 6.3 关键组件
- **Uploader**: 支持悬浮窗显示的上传任务管理器，支持断点续传。
- **FileViewer**: 侧边弹出或全屏模态框，根据文件后缀动态加载播放器或编辑器。
- **ShareModal**: 生成分享链接，配置过期时间与提取码。

## 7. 部署与环境要求
- **容器化**: 提供 `Dockerfile` 与 `docker-compose.yml`。
- **环境**:
  - Go 1.21+
  - Node.js 18+
  - MySQL 5.7
  - Redis 7+
- **反向代理**: 推荐 Nginx 开启 Gzip/Brotli 压缩，并配置大文件上传限制。

## 8. 开发路线图 (Roadmap)
1. **Phase 1**: 后端核心框架 + 数据库模型 + 本地驱动实现。
2. **Phase 2**: 前端基础框架 + 文件列表展示 + 上传下载逻辑。
3. **Phase 3**: 多驱动集成 (S3, OSS, SFTP) + 分片上传。
4. **Phase 4**: 用户系统 + 邀请码/学园币经济系统。
5. **Phase 5**: 预览插件集成 (视频播放、文档预览、代码编辑)。
6. **Phase 6**: 管理员后台 + 统计看板。
```
StfreyaNetdisk/
├── backend/            # Go 后端
│   ├── api/            # 路由处理
│   ├── cmd/            # 程序入口
│   ├── config/         # 配置文件
│   ├── driver/         # 存储驱动实现
│   ├── middleware/     # 中间件 (JWT, 日志)
│   ├── model/          # 数据库模型
│   ├── service/        # 业务逻辑
│   └── utils/          # 工具函数
├── frontend/           # React 前端
│   ├── src/
│   │   ├── api/        # 接口请求
│   │   ├── components/ # 通用组件
│   │   ├── pages/      # 页面视图
│   │   ├── store/      # 状态管理
│   │   └── utils/      # 工具类
└── docker-compose.yml  # 环境部署
```
