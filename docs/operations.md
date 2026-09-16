# 运维手册

## Vercel 配置

Vercel 项目应将 **Root Directory** 设置为 `vercel-app`。仓库根目录的 `vercel.json` 必须保留 `framework: "nextjs"`，否则 Vercel 可能按静态项目寻找 `public/` 或 `dist/` 输出目录。

已有 Neon 项目需要在 Vercel 的 Environment Variables 中手动连接。Marketplace 的 Neon 安装流程会创建新资源，不能用于附加已有项目。

| 变量 | 可见性 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | Secret | Neon PostgreSQL 的生产池化连接串 |
| `NEON_AUTH_BASE_URL` | Secret | Neon Auth 服务端基础地址 |
| `NEON_AUTH_COOKIE_SECRET` | Secret | 至少 32 个随机字符，用于认证 Cookie |
| `NEXT_PUBLIC_SITE_URL` | Config | 生产站点地址，例如 `https://baobaodae.dpdns.org` |

前缀为 `NEXT_PUBLIC_` 的变量会打包给浏览器，因此 Vercel 要求它使用 **Config** 而非 **Secret**；它只能保存公开 URL，绝不能保存密码、授权码或连接串。

## Neon 与邮件

生产数据库使用 `vercel-app/db/migrations/0001_account.sql` 所定义的业务表。后续改表时先新增迁移文件，再在目标 Neon 分支执行；不要直接编辑已应用的迁移。

在 Neon Auth 中：

1. 将 Vercel 预览域名和 `https://baobaodae.dpdns.org` 加入可信域名。
2. 配置 QQ SMTP：发件邮箱使用完整 QQ 邮箱地址，密码字段使用 QQ 邮箱生成的 SMTP 授权码，不是 QQ 登录密码。
3. 保存后用一个测试邮箱走一遍注册、收信、验证和登录。不要把测试邮件截图中的授权码或会话 Cookie 发到公共渠道。

## 域名与部署检查

DigitalPlat 中，根记录 `@` 的 A 记录必须指向 Vercel 域名页面给出的 IP；Vercel 若要求验证，再添加它给出的 `_vercel` TXT 记录。DNS 生效后，在 Vercel Domains 页面刷新确认状态。

每次生产部署后可做以下无敏感信息检查：

```powershell
Invoke-WebRequest https://baobaodae.dpdns.org/sign-in
Invoke-WebRequest https://baobaodae.dpdns.org/api/auth/get-session
```

未登录访问 `get-session` 返回 `null` 是正常现象；它说明认证路由可达，不等于邮件发送已通过。还应手动验证注册、QQ 邮件、登录、资料更新和文章详情页的收藏切换。

## 常见构建错误

| Vercel 错误 | 原因 | 处理 |
| --- | --- | --- |
| 找不到 `dist/` | 仍配置了静态站的 `outputDirectory` | 删除静态输出配置，保留 Next.js framework 声明 |
| 找不到 `public/` 或 `STATIC_BUILD_NO_OUT_DIR` | 项目被识别为静态框架 | 确认 Root Directory 为 `vercel-app`，且根目录 `vercel.json` 声明 `nextjs` |
| `NEXT_PUBLIC_*` 不能为 Secret | Vercel 的公开变量规则 | 将该变量改为 Config；不要改动真正的 Secret 变量 |
