# Vercel 动态站与 Neon Auth 实施计划

## 前置条件

- Vercel 项目 `melondy101-github-io` 保持关联当前 GitHub 仓库。
- 在 Vercel 项目设置中将 Root Directory 设置为 `vercel-app`。
- 通过 Vercel Marketplace 连接 Neon Integration，并启用 Neon Auth。
- 在 Neon Auth 中配置 QQ SMTP 授权码、生产域名和本地开发域名。

## 实施顺序

1. 创建 `vercel-app` Next.js 应用、TypeScript 配置、基础页面和独立构建脚本；根目录的 GitHub Pages 构建保持不变。
2. 为动态应用添加 Neon Auth 服务端与客户端适配、公开路由、受保护账户路由和安全会话配置。
3. 使用迁移定义 `profiles` 与 `article_favorites`，并通过服务器端数据访问层实现用户资料和收藏操作。
4. 实现注册、验证、登录、退出、账户资料编辑，以及文章详情页的收藏切换。
5. 将现有文章内容引入动态站的详情页；收藏控件只在详情页显示，未登录时返回登录页并保留回跳地址。
6. 加入接口限流、输入校验、统一错误反馈和环境变量样例；确保秘密变量不进入 Git。
7. 验证静态 GitHub Pages 构建不受影响；验证 Vercel 预览部署、受保护路径和生产环境配置。

## 测试边界（待确认）

只测试下列公开边界：

1. `POST /api/profile`：已认证用户只能更新自己的有效资料；未认证请求返回 `401`。
2. `POST /api/articles/:slug/favorite`：已认证用户可收藏或取消收藏，重复收藏不产生重复数据；未认证请求返回 `401`。
3. 页面路由：未认证访问 `/account` 被引导至登录页；文章详情页对未认证用户显示登录后收藏入口。

Neon Auth、QQ SMTP 和 Neon 数据库本身作为外部服务，以测试替身隔离；上线前再用真实预览环境进行一轮端到端验证。

## 验收

- 根目录 `npm run build` 仍生成可被 GitHub Pages 发布的 `dist/`。
- Vercel 动态站可注册、验证邮箱、登录、退出、维护资料。
- 收藏操作仅可在文章详情页触发，并仅影响当前已登录用户。
- 密码、SMTP 授权码和数据库 URL 不出现在浏览器响应、日志、Git 追踪文件或测试输出中。
