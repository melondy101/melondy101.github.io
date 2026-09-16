# melondy101.github.io

黄毅的个人作品集与写作站采用两套彼此独立的部署：GitHub Pages 保留静态兜底站，Vercel 承载需要服务器和数据库的账户功能。

| 站点 | 用途 | 构建入口 |
| --- | --- | --- |
| GitHub Pages | 静态主页和文章兜底 | 仓库根目录的 `npm run build`，输出到 `dist/` |
| Vercel | 登录、注册、个人资料和文章收藏 | `vercel-app/` 中的 Next.js 应用 |

生产动态站使用 [baobaodae.dpdns.org](https://baobaodae.dpdns.org)。

## 本地运行

静态站：

```powershell
npm install
npm run build
```

生成结果位于 `dist/`。新文章放在 `content/writing/`；复制 `_template.md` 并填写标题、日期和分类即可。

动态站：

```powershell
Set-Location vercel-app
npm install
Copy-Item .env.example .env.local
npm test
npm run dev
```

在填写 `.env.local` 前先阅读 [运维手册](docs/operations.md)。真实密钥只能保存在 Neon、Vercel 或本机未追踪的 `.env.local`，不能提交到仓库或发送到聊天中。

## 文档

- [架构说明](docs/architecture.md)：部署边界、认证和数据模型。
- [接口与用户流程](docs/integration-guide.md)：动态路由、API 认证边界与收藏行为。
- [运维手册](docs/operations.md)：环境变量、Neon、QQ SMTP、域名与验收步骤。
- [原始设计](docs/superpowers/specs/2026-09-16-vercel-neon-auth-design.md) 与 [实施计划](docs/superpowers/plans/2026-09-16-vercel-neon-auth-implementation.md)：第一版范围和实现决策。
