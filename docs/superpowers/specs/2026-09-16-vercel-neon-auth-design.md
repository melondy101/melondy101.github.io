# Vercel 动态站与 Neon Auth 设计

## 目标

保留 GitHub Pages 作为无需服务端的静态兜底站，同时在 Vercel 上运行独立的动态站。动态站第一版提供 QQ 邮箱注册、邮箱验证码验证、邮箱加密码登录、个人资料维护和文章收藏。动态站绑定用户自有域名；`melondy101.github.io` 继续仅由 GitHub Pages 提供服务。

## 部署边界

```text
仓库根目录
├─ scripts/build.mjs + dist/  -> GitHub Pages
└─ vercel-app/                -> Vercel 动态应用
                                  -> 自有域名
                                  -> Neon PostgreSQL / Neon Auth
```

现有 GitHub Actions 工作流保持不变：它执行根目录的 `npm run build`，并只上传 `dist/`。Vercel 项目的 Root Directory 设置为 `vercel-app`，因此不会执行或发布根目录的静态构建产物。

## 技术选择

- 动态应用：Next.js App Router，运行在 Vercel。
- 认证：Neon Auth（托管 Better Auth）。它负责认证账户、密码哈希、会话、邮箱验证和密码重置；业务代码不得自行保存或读取密码明文。
- 数据库：Neon PostgreSQL。Vercel Neon Integration 向 Vercel 环境注入连接变量。
- 邮件：QQ 邮箱 SMTP。使用 QQ 邮箱“授权码”而不是邮箱登录密码发送验证和重置邮件。
- 数据访问：服务端路由和服务端组件使用带连接池的 PostgreSQL 连接；浏览器不能获得 `DATABASE_URL`。

## 用户流程

### 注册与验证

1. 用户填写 QQ 邮箱、密码、姓氏、昵称和显示账号。
2. 服务端将邮箱与密码交给 Neon Auth；密码只以不可逆哈希形式由认证系统保存。
3. Neon Auth 经 QQ SMTP 发送邮箱验证码。
4. 用户完成验证后，系统建立会话并创建或补全个人资料。

### 登录与账户

1. 用户通过 QQ 邮箱和密码登录。
2. Neon Auth 校验密码并以安全 Cookie 维持会话。
3. 已登录用户可访问 `/account`，修改姓氏、昵称和显示账号，并查看自己的文章收藏。
4. 未登录用户访问账户页或受保护 API 时，被重定向到登录页或收到 `401`。

### 收藏

1. 已登录用户在文章入口选择收藏或取消收藏。
2. 服务端从会话取得用户身份，拒绝客户端传入的任意用户 ID。
3. 同一用户对同一文章最多存在一条收藏记录。

## 数据模型

认证相关表由 Neon Auth 管理，应用不直接操作密码列。业务数据使用独立表：

```text
profiles
  id                 uuid primary key
  auth_user_id       text unique not null
  last_name          text not null
  nickname           text not null
  handle             text unique not null
  created_at         timestamptz not null
  updated_at         timestamptz not null

article_favorites
  id                 uuid primary key
  profile_id         uuid references profiles(id) not null
  article_slug       text not null
  created_at         timestamptz not null
  unique(profile_id, article_slug)
```

文章正文仍从仓库中的 `content/writing/` 构建或读取；第一版不建立文章管理后台。

## 安全与配置

- 会话 Cookie 必须是 `HttpOnly`、`Secure`、`SameSite=Lax`。
- 登录、注册、验证码发送和验证码校验需要限流；错误提示不得暴露邮箱是否已注册。
- `DATABASE_URL`、QQ SMTP 授权码、认证 Cookie 密钥和 Neon Auth 变量仅存放于 Vercel/Neon 环境变量；`.env.local` 必须被 Git 忽略。
- 生产自有域名、Vercel 预览域名和本地开发域名必须登记为 Neon Auth 的可信域名，避免认证回调被拒绝。
- 生产运行时使用 Neon 的池化连接串；数据库迁移使用非池化连接串。

## 发布与验收

1. GitHub Pages 继续从 `dist/` 成功发布并能访问首页和文章。
2. Vercel 从 `vercel-app` 构建动态站，并能以 `*.vercel.app` 预览。
3. Vercel Neon Integration 完成后，生产环境使用 Neon PostgreSQL，预览环境使用隔离的 Neon 分支。
4. 自有域名绑定到 Vercel，并添加至 Neon Auth 的可信域名。
5. 以新用户验证：注册、接收 QQ 邮箱验证码、验证、登录、退出、修改资料、收藏、取消收藏。
6. 验证未认证用户无法读取或修改资料和收藏；确认页面、响应和日志均不包含密码、SMTP 授权码或数据库连接串。

## 明确不在第一版范围

- 社交登录、双因素认证、组织/角色权限。
- 文章后台、评论、文件上传、推荐系统。
- 跨设备收藏同步以外的个性化功能。
