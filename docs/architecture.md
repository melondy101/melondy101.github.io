# 架构说明

## 部署边界

```text
仓库根目录
├─ content/、scripts/、dist/       GitHub Pages 静态站
└─ vercel-app/                     Vercel Next.js 动态站
   ├─ 自管认证适配层                 会话、密码、验证码、QQ SMTP 邮件
   └─ Neon PostgreSQL              users、profiles、article_favorites、认证限流记录
```

根目录的 GitHub Actions 工作流只构建并发布 `dist/`，不依赖数据库。Vercel 的 Root Directory 是 `vercel-app`；仓库根目录的 `vercel.json` 明确声明 Next.js，避免 Vercel 将该项目误判为静态站。

## 身份与数据

应用自管邮箱密码认证：密码只以 scrypt 哈希保存，验证码以 HMAC 摘要保存，JWT 会话只放在 HttpOnly Cookie 中。浏览器只经由 `/api/auth/*` 与认证服务交互；服务器端从会话读取当前用户，再访问 PostgreSQL。会话、邮件、验证码和数据访问经独立适配层实现，因此可分别替换部署平台、邮件供应商或数据库实现。

应用表由 `vercel-app/db/migrations/0001_account.sql` 与 `0002_self_managed_auth.sql` 定义：

- `users`：本站用户的规范化邮箱、密码哈希与昵称。
- `profiles`：将认证用户映射到姓氏、昵称和显示账号。
- `article_favorites`：以 `(profile_id, article_slug)` 唯一约束保存收藏。
- `email_verifications`、`auth_attempts`：验证码消费和反滥用记录。

`DATABASE_URL` 仅在 Vercel 服务器端可用。客户端不能传递用户 ID 来指定资料或收藏的归属。

## 当前路由

| 路径 | 访问方式 | 作用 |
| --- | --- | --- |
| `/`、`/writing`、`/writing/[slug]` | 公开 | 动态站主页、文章列表和文章详情 |
| `/sign-in`、`/sign-up`、`/reset-password` | 公开 | 邮箱密码登录、验证码注册、密码重置和个人资料首次填写 |
| `/account` | 需要会话 | 编辑自己的资料、查看自己的收藏 |
| `/api/auth/login`、`register`、`send-code`、`reset-password`、`logout`、`me` | 应用认证 API | 自管认证入口 |
| `/api/profile` | 需要会话 | 更新当前用户资料 |
| `/api/articles/[slug]/favorite` | 需要会话 | 切换当前用户对指定文章的收藏 |

收藏控件只在 `/writing/[slug]` 的文章详情页出现。未登录请求受保护的页面会被重定向至登录页，受保护 API 返回 `401`。

## 当前内容范围

GitHub Pages 的文章正文由 `content/writing/` 构建。动态站目前提供相同文章标识的详情入口和收藏锚点，但尚未复用完整 Markdown 正文；在将两端文章渲染统一前，它只展示站内的简短说明。这是第一版需要继续完成的内容同步工作，不影响账户和收藏数据的隔离。
