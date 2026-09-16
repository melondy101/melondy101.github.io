# 自管 QQ SMTP 认证迁移设计

## 目标与范围

动态站从 Neon Auth 一次性切换到应用自管的邮箱密码认证。当前没有需要迁移的正式用户；访客不能收藏或写入业务数据，因此不创建临时账号，也不进行访客数据过户。

登录、注册、邮件验证码和密码重置均在 Next.js 应用内实现。QQ 邮箱通过 SMTP 授权码发送注册及重置验证码。GitHub Pages 静态站的构建和部署边界保持不变。

## 认证与会话

服务端以 `crypto.scrypt` 生成带随机盐的密码哈希，密码明文不写入数据库、日志或响应。成功注册、登录和重置密码后，服务端签发只含用户 ID、签发时间和过期时间的 JWT，并写入 `__Host-session` Cookie。

Cookie 设置为 `HttpOnly`、`SameSite=Lax`、`Path=/`、30 天有效；生产环境额外设置 `Secure`。JWT 用独立的 `AUTH_JWT_SECRET` 签名。每个受保护的页面和 API 都从该 Cookie 验证当前用户，绝不接受客户端提交的用户 ID。

`/account` 仍是个人主页。全站页头右上角提供身份入口：无会话时显示“登录”和“注册”；有会话时显示昵称，链接到 `/account`，并在个人主页提供退出入口。

## 数据模型与迁移

新增迁移创建以下表，并把现有 `profiles.auth_user_id` 的语义改为本站 `users.id`。由于尚无生产用户和收藏，迁移可以直接清理旧的 Neon Auth 关联数据，不需要兼容层。

### users

- `id uuid primary key`
- `email varchar(256) not null`：保留用户输入后经 `trim()` 的展示邮箱。
- `email_lower varchar(256) not null unique`：`trim().toLowerCase()`，用于全部查重、登录和验证码查询。
- `password_hash text not null`
- `name text not null`：注册昵称；资料页仍可维护 `profiles` 中的展示资料。
- `created_at`、`updated_at timestamptz not null`

### email_verifications

- `id uuid primary key`
- `email_lower varchar(256) not null`
- `purpose text not null`：仅允许 `register`、`reset_password`。
- `code_hash text not null`：验证码经 HMAC-SHA-256 加服务器密钥后保存，不能由数据库记录还原。
- `attempts integer not null default 0`
- `expires_at timestamptz not null`
- `created_at timestamptz not null`

每个 `(email_lower, purpose)` 的最新有效记录是唯一可校验验证码。重发时事务性删除同键旧记录再插入新记录；成功消费或第五次失败时删除该记录。

### auth_attempts

- `id uuid primary key`
- `ip text not null`
- `email_hash text`：规范化邮箱的 HMAC 摘要，可为空以支持未知邮箱登录限流。
- `kind text not null`：`send_code`、`register`、`login`、`reset_password`。
- `attempted_at timestamptz not null`

表只保存限流所需的最小审计信息；验证码、密码、授权码与完整邮箱均不写入。

## API 与邮件流

所有路由为同源 `POST` JSON API，并用 Zod 限制字段长度、邮箱格式、验证码六位数字及密码最少八位。

| 路由 | 行为 |
| --- | --- |
| `/api/auth/send-code` | 接收邮箱与用途；检查 IP/邮箱冷却及窗口限流，创建验证码记录，通过 QQ SMTP 发送邮件。为防枚举，重置密码始终返回相同成功文案。 |
| `/api/auth/register` | 校验 `register` 验证码；若邮箱不存在则创建用户、消费验证码、签发会话。已存在邮箱返回可行动提示但不泄露密码信息。 |
| `/api/auth/login` | 查规范化邮箱、验证密码、记录尝试；成功签发会话，失败返回统一错误。 |
| `/api/auth/forgot-password` | 仅作为 `send-code` 的 `reset_password` 用途入口，始终显示“如账号存在，验证码已发送”。 |
| `/api/auth/reset-password` | 校验重置验证码，在事务中更新密码哈希并消费验证码，签发新会话。 |
| `/api/auth/logout` | 删除 `__Host-session` Cookie。 |
| `/api/auth/me` | 返回最小当前用户资料，供页头渲染。 |

Nodemailer 使用 `SMTP_HOST=smtp.qq.com`、`SMTP_PORT=465`、`secure: true`、`QQ_EMAIL_USER` 和 QQ 16 位 SMTP 授权码 `QQ_EMAIL_PASS`。`EMAIL_FROM` 可选，默认发件人为 QQ 邮箱。注册邮件与重置邮件使用不同主题和正文，均明确十分钟有效、非本人操作可忽略。

## 限流、失败与错误处理

- 同一 IP 和同一邮箱每 60 秒最多发送一次验证码；15 分钟内分别最多 5 次和 3 次。
- 同一 IP 15 分钟内最多 10 次登录或重置校验失败；超过限制返回 `429` 与重试提示。
- 验证码十分钟有效，最多五次尝试。过期、错误或耗尽均用同一错误响应。
- SMTP、数据库及意外错误在服务器记录无敏感上下文的诊断信息，客户端只收到通用失败文案；邮件发送失败时不保留可用验证码。

## 页面流

注册页依次收集邮箱、验证码、密码和现有的资料字段；资料仅在注册成功并取得会话后写入。登录页保留邮箱密码表单，新增“忘记密码”链接。重置页先请求验证码，再提交验证码与新密码。用户可从右上角入口或登录后的回跳地址进入个人主页。

收藏按钮维持现有约束：仅文章详情页显示，未登录用户仅看到引导登录入口；系统不创建匿名收藏。资料和收藏路由都由新的会话校验保护。

## 配置、依赖与清理

移除 `@neondatabase/auth` 及其相关环境变量，新增 `AUTH_JWT_SECRET`、`AUTH_CODE_SECRET`、`QQ_EMAIL_USER`、`QQ_EMAIL_PASS`、`SMTP_HOST`、`SMTP_PORT`、`EMAIL_FROM`。真实值只放入本机 `.env.local` 与 Vercel 环境变量；示例文件只写键名和说明。

增加 `nodemailer`、`jose` 及其 TypeScript 类型。删除 Neon Auth catch-all 路由与代理中间件，替换为应用自己的会话辅助函数和 `/account` 的服务端重定向。

## 验证

单元与接口测试覆盖密码哈希、JWT 校验、邮箱规范化、验证码用途隔离、过期/重试次数、重发失效及 IP/邮箱限流。API 测试覆盖注册、登录、忘记密码/重置、退出、受保护资料与收藏，以及无会话时的右上角入口状态。构建验证包含 `vercel-app` 的测试与构建，以及仓库根目录 `npm run build`。
