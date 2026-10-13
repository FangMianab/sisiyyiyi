# Seductive Bio Homepage (Cloudflare Pages Ready)

这是一个为您定制的高端、诱惑风格个人 Bio 主页项目，完美适配手机与电脑浏览器，内置可视化管理后台、安全登录、直达跳转（无成人弹窗提示）、多媒体播放器（支持本地视频/外链如B站）、图片展示弹窗、多色调预设以及自定义字体上传功能。

项目已针对 **Cloudflare Pages** 进行了深度优化，支持通过 GitHub 仓库进行一键式免费托管与持续部署。

---

## 🚀 部署到 Cloudflare Pages 详细教程

### 第一步：准备 GitHub 仓库
1. 将本项目解压后的所有文件上传到您的 GitHub 仓库中（例如命名为 `my-bio-page`）。
2. 确保仓库包含 `public/` 文件夹、`functions/` 文件夹以及 `wrangler.toml` 等配置文件。

### 第二步：在 Cloudflare 中连接仓库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 在左侧菜单栏选择 **Workers & Pages** -> 点击 **Create application** -> 选择 **Pages** 选项卡 -> 点击 **Connect to Git**。
3. 授权并选择您的 GitHub 账号及刚刚创建的 `my-bio-page` 仓库。

### 第三步：配置构建设置 (Build Settings)
在配置页面中填写以下构建参数：
- **Production branch**: `main` (或 `master`)
- **Framework preset**: `None`
- **Build command**: `(留空)`
- **Build output directory**: `public`

### 第四步：设置管理员账号环境变量（关键！）
在 Cloudflare Pages 项目创建页面（或创建完成后进入 **Settings** -> **Environment variables**）：
点击 **Add variable**，分别添加两个环境变量用于后台登录验证：
1. **Variable name**: `ADMIN_USER`
   - **Value**: 输入您自定义的管理员用户名（例如 `admin`）
2. **Variable name**: `ADMIN_PASS`
   - **Value**: 输入您自定义的管理员密码（例如 `securepassword123`）
   *(注意：请确保选择 Production 和 Preview 环境都生效)*

### 第五步：完成部署与访问
1. 点击 **Save and Deploy**，等待 Cloudflare 编译并生成主页链接（形如 `https://xxx.pages.dev`）。
2. 点击生成的网址即可访问您的个人主页。

---

## 🔐 如何进入后台管理
1. 在您的主页底部或通过直接访问 `/admin.html` 进入后台登录页。
2. 输入您在第四步在 Cloudflare 中设置的 `ADMIN_USER` 和 `ADMIN_PASS` 即可登录。
3. 登录后您可以在后台：
   - 修改头像、昵称、个人简介。
   - 切换或自定义整体色调预设（Velvet Ruby, Midnight Orchid, Obsidian Gold, Siren Crimson）。
   - 上传/更换自定义商用字体。
   - 添加、编辑、删除跳转按钮（支持普通直达链接、视频播放按钮、图片展示按钮）。
