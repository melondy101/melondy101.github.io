# 架构说明

## 部署边界

```text
仓库根目录
├─ content/、scripts/、dist/       GitHub Pages 静态站
└─ vercel-app/                     Vercel Next.js 动态站
   ├─ Neon Auth                    账户、密码哈希、会话、验证邮件
   └─ Neon PostgreSQL              profiles、article_favorites
```

根目录的 GitHub Actions 工作流只构建并发布 `dist/`，不依赖数据库。Vercel 的 Root Directory 是 `vercel-app`；仓库根目录的 `vercel.json` 明确声明 Next.js，避免 Vercel 将该项目误判为静态站。

## 身份与数据

Neon Auth 管理邮箱、密码哈希、会话和邮件验证。应用不会保存或返回密码明文。浏览器只经由 `/api/auth/*` 与认证服务交互；服务器端从会话读取当前用户，再访问 Neon PostgreSQL。

应用业务表由 `vercel-app/db/migrations/0001_account.sql` 定义：

- `profiles`：将认证用户映射到姓氏、昵称和显示账号。
- `article_favorites`：以 `(profile_id, article_slug)` 唯一约束保存收藏。

`DATABASE_URL` 仅在 Vercel 服务器端可用。客户端不能传递用户 ID 来指定资料或收藏的归属。

## 当前路由

| 路径 | 访问方式 | 作用 |
| --- | --- | --- |
| `/`、`/writing`、`/writing/[slug]` | 公开 | 动态站主页、文章列表和文章详情 |
| `/sign-in`、`/sign-up` | 公开 | 邮箱密码登录、注册和个人资料首次填写 |
| `/account` | 需要会话 | 编辑自己的资料、查看自己的收藏 |
| `/api/auth/[...path]` | 认证服务 | Neon Auth 的路由代理 |
| `/api/profile` | 需要会话 | 更新当前用户资料 |
| `/api/articles/[slug]/favorite` | 需要会话 | 切换当前用户对指定文章的收藏 |

收藏控件只在 `/writing/[slug]` 的文章详情页出现。未登录请求受保护的页面会被重定向至登录页，受保护 API 返回 `401`。

## 当前内容范围

GitHub Pages 的文章正文由 `content/writing/` 构建。动态站目前提供相同文章标识的详情入口和收藏锚点，但尚未复用完整 Markdown 正文；在将两端文章渲染统一前，它只展示站内的简短说明。这是第一版需要继续完成的内容同步工作，不影响账户和收藏数据的隔离。
