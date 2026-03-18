<div align="center">

[![Vue](https://img.shields.io/badge/Vue-2.7.16-brightgreen.svg)](https://v2.cn.vuejs.org/)
[![Vue Router](https://img.shields.io/badge/VueRouter-3.6.5-red.svg)](https://router.vuejs.org/)
[![Vuex](https://img.shields.io/badge/Vuex-3.6.2-purple.svg)](https://vuex.vuejs.org/zh/)
[![Element UI](https://img.shields.io/badge/ElementUI-2.15.14-blue.svg)](https://element.eleme.cn/#/zh-CN)
[![Axios](https://img.shields.io/badge/Axios-1.11.0-yellow.svg)](https://axios-http.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.txt)

## 🍟 如果这个项目对你有帮助，请 Star 支持

</div>

## 🌟 项目简介

`blog-admin` 是博客系统的后台管理端，基于 Vue2 + Element UI 开发，面向内容管理与系统管理场景。

项目支持动态路由、按钮级权限、滑块验证码、RSA 密码加密、JWT 自动续期等能力，可与 `blog` 后端无缝配合，完成从登录到权限控制再到业务管理的完整闭环。

## 🔗 相关项目

- 后端服务（Spring Boot）：<https://github.com/OOMEcho/blog>
- 博客前台（Vue2）：<https://github.com/OOMEcho/blog-web>
- 当前仓库（后台）：<https://github.com/OOMEcho/blog-admin>

## 🧭 架构设计

### 1) 系统整体架构

```text
┌───────────────────────┐
│ Browser               │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ blog-admin (Vue2)     │
│ Router + Vuex + UI    │
└──────────┬────────────┘
           │ /api
           ▼
┌───────────────────────┐
│ blog-api (SpringBoot) │
└──────────┬────────────┘
           ├────────────► MySQL
           └────────────► Redis
```

### 2) 前端工程架构

| 层级 | 目录 | 职责 |
| --- | --- | --- |
| 接口层 | `src/api` | 业务 API 封装 |
| 路由层 | `src/router` | 登录守卫、动态路由注入、404 回退 |
| 状态层 | `src/store/modules` | 认证状态、权限路由、标签页缓存 |
| 视图层 | `src/views` | 仪表盘、系统管理、博客管理、日志管理等页面 |
| 组件层 | `src/components` | Layout、登录注册、滑块验证码、侧栏、标签页 |
| 能力层 | `src/utils`、`src/directive` | 请求拦截、加密工具、按钮权限指令 |

### 3) 关键流程

1. 登录页支持账号密码/邮箱验证码两种方式，提交前通过滑块校验。
2. 密码登录会先用后端公钥进行 RSA 加密，再发送登录请求。
3. 登录成功后保存 Access Token；401 时自动请求刷新接口并重放原请求。
4. 获取用户信息后生成动态路由，页面按钮通过 `v-perm` 做权限可见性控制。

## ✨ 核心优势

- 安全链路完善：滑块验证码 + RSA + Access/Refresh Token + 自动续期重放。
- 权限模型清晰：后端菜单树驱动路由，权限码驱动按钮，前后端一致。
- 内容运营能力完善：支持 Markdown 文章发布/编辑/预览与审核流，支持博客配置项可视化维护。
- 模块覆盖完整：用户、角色、菜单、资源、字典、白名单、文章、博客配置、日志、文件、通知。
- 可维护性高：按模块拆分 API、Store、View，目录职责单一、扩展成本低。
- 部署友好：支持本地代理联调、同域反向代理、跨域独立部署三种模式。

## 🏗️ 技术栈

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| Vue | 2.7.16 | 前端框架 |
| Vue Router | 3.6.5 | 路由管理（history 模式） |
| Vuex | 3.6.2 | 状态管理 |
| Element UI | 2.15.14 | UI 组件库 |
| Axios | 1.11.0 | 请求库 |
| ECharts | 4.9.0 | 图表展示 |
| mavon-editor | 2.10.4 | Markdown 编辑/预览 |
| node-forge | 1.3.3 | RSA 加解密 |
| NProgress | 0.2.0 | 路由加载进度 |

## 🚀 快速开始

### 1) 环境准备

- Node.js 16+
- npm 8+

### 2) 克隆项目

```bash
git clone https://github.com/OOMEcho/blog-admin.git
cd blog-admin
```

### 3) 安装依赖

```bash
npm install
```

### 4) 配置环境变量

开发环境（`.env.development`）：

```bash
VUE_APP_BASE_PRE=/api
VUE_APP_BASE_API=http://127.0.0.1:9090
```

生产环境（`.env.production`）推荐两种模式：

```bash
# 模式A：同域反向代理（推荐）
VUE_APP_BASE_API=/api

# 模式B：独立 API 域名
VUE_APP_BASE_API=https://api.yourblog.cn
```

### 5) 启动开发服务

```bash
npm run serve
```

默认访问：<http://127.0.0.1:9099>

### 6) 登录验证

- 先确保后端 `blog` 已运行在 `http://127.0.0.1:9090`。
- 默认管理员账号（后端初始化）：`admin / 123456`。

## 🌐 部署说明

### 1) 打包

```bash
npm run build
```

产物目录：`dist/`

### 2) Nginx 部署（同域反向代理）

> 使用该方案前，请将 `.env.production` 的 `VUE_APP_BASE_API` 设置为 `/api` 后重新构建。

```nginx
server {
  listen 80;
  server_name admin.yourblog.cn;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:9090/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

### 3) 部署验收清单

- 打开登录页正常。
- 登录后能看到动态菜单。
- 刷新二级页面不出现 404。
- 长时间操作后 Token 可自动刷新。

## 🧩 三端联调

```bash
# 后端
cd D:\Project\OtherProjects\blog
mvn spring-boot:run

# 后台
cd D:\Project\FrontEndProjects\blog-admin
npm run serve

# 前台
cd D:\Project\FrontEndProjects\blog-web
npm run serve
```

默认端口：后端 `9090`，后台 `9099`，前台 `9088`。

## 🖼️ 界面预览（待补充）

| 页面 | 说明 | 图片 |
| --- | --- | --- |
| 登录页 | 账号登录/邮箱登录/滑块验证 | 待补充 |
| 仪表盘 | 统计卡片与访问趋势 | 待补充 |
| 用户管理 | 用户分页、状态、角色分配 | 待补充 |
| 角色权限 | 角色绑定权限与菜单 | 待补充 |
| 日志管理 | 登录日志、操作日志导出 | 待补充 |

## ❓ 常见问题

1. 登录后跳回登录页：优先检查后端是否可达、`VUE_APP_BASE_API` 是否正确。
2. 401 刷新失败：检查后端 `security.login.cookie-path` 与前端请求路径是否一致。
3. 页面刷新 404：确认 Nginx 已配置 `try_files $uri $uri/ /index.html`。

## 🤝 贡献

1. Fork 仓库
2. 创建分支：`git checkout -b feature/xxx`
3. 提交代码：`git commit -m "feat: xxx"`
4. 发起 Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE.txt) 开源。

---

<div align="center">

Made with ❤️ by 南常

</div>
