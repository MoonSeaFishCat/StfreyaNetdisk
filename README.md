# StfreyaNetdisk (圣芙蕾雅网盘)

![StfreyaNetdisk](https://img.shields.io/badge/StfreyaNetdisk-v1.0.0-pink.svg)
![Go](https://img.shields.io/badge/Golang-1.20+-blue.svg)
![React](https://img.shields.io/badge/React-18.0+-cyan.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange.svg)

StfreyaNetdisk 是一款基于 Golang 和 React 开发的高性能、多存储支持的网盘系统。采用萌系治愈风格设计，支持黑夜/白天双重模式，具备完善的文件管理、多用户系统及存储扩展能力。

## ✨ 核心特性

- 📁 **多存储后端支持**：支持 Local、阿里云 OSS、腾讯云 COS、华为云 OBS (S3 兼容)、微软 OneDrive 以及 SFTP 远程服务器。
- 🛡️ **安全认证**：基于 JWT 的身份验证，支持图片验证码登录注册。
- 💎 **学园币系统**：支持通过签到获取学园币，并使用学园币兑换注册邀请码。
- 📝 **在线编辑**：内置 Monaco Editor，支持文本文件、代码文件的在线预览与编辑。
- 🎬 **多媒体预览**：支持图片预览、视频在线播放（MP4/WebM/OGG）。
- 🕒 **版本控制**：文件修改自动保存历史版本，支持一键还原。
- 🌐 **WebDAV 支持**：支持通过 WebDAV 协议连接网盘，方便挂载为本地磁盘。
- 🗑️ **回收站功能**：支持文件删除入回收站，防止误删，支持一键还原或彻底删除。
- 🔗 **分享系统**：支持创建分享链接，设置过期时间及提取码。
- ⚡ **批量操作**：支持文件的批量下载（自动打包 Zip）、批量删除、移动及重命名。
- 🎨 **萌系 UI**：精心设计的浅色萌系 UI，支持黑夜模式切换，极佳的用户体验。

## 🛠️ 技术栈

### 后端 (Backend)
- **语言**: Golang 1.20+
- **框架**: Gin (Web 框架)
- **ORM**: GORM (支持 MySQL 5.7)
- **认证**: JWT-Go
- **存储驱动**: 自研存储抽象层，支持多驱动动态切换
- **协议**: WebDAV

### 前端 (Frontend)
- **框架**: React 18
- **构建工具**: Vite
- **UI 组件库**: Ant Design (定制萌系皮肤)
- **状态管理**: Zustand (配合 Persist 持久化)
- **动画**: Framer Motion
- **样式**: Tailwind CSS
- **编辑器**: Monaco Editor

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/StfreyaNetdisk.git
cd StfreyaNetdisk
```

### 2. 后端部署
```bash
cd backend
# 复制并修改配置文件 (如果有)
go mod tidy
go run main.go
```
*后端默认运行在 `localhost:8080`，首次运行会自动迁移数据库表结构。*

### 3. 前端部署
```bash
cd frontend
pnpm install
pnpm dev
```
*前端默认运行在 `localhost:5173`。*

## 📖 目录结构

- `backend/`: 后端源代码
  - `api/`: 控制器层，处理 HTTP 请求
  - `middleware/`: 中间件（认证、CORS等）
  - `model/`: 数据库模型及迁移
  - `service/`: 核心业务逻辑
  - `driver/`: 存储驱动实现
  - `utils/`: 工具函数（验证码、加密等）
- `frontend/`: 前端源代码
  - `src/api/`: 请求封装
  - `src/components/`: 通用组件
  - `src/pages/`: 页面组件
  - `src/store/`: 状态管理
  - `src/theme/`: 主题配置

## 🤝 贡献建议

欢迎提交 Issue 或 Pull Request 来完善 StfreyaNetdisk！

## 📄 开源协议

本项目采用 MIT 协议开源。

---
*May the cute power be with you!* 🌸
