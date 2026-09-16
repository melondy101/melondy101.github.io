# 运维手册

## Vercel 配置

Vercel 项目应将 **Root Directory** 设置为 `vercel-app`。仓库根目录的 `vercel.json` 必须保留 `framework: "nextjs"`，否则 Vercel 可能按静态项目寻找 `public/` 或 `dist/` 输出目录。

已有 Neon 项目需要在 Vercel 的 Environment Variables 中手动连接。Marketplace 的 Neon 安装流程会创建新资源，不能用于附加已有项目。

| 变量 | 可见性 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | Secret | Neon PostgreSQL 的生产池化连接串 |
| `AUTH_JWT_SECRET` | Secret | 至少 32 个随机字符，用于本站 JWT Cookie 签名 |
| `AUTH_CODE_SECRET` | Secret | 与 JWT 密钥不同，用于验证码与邮箱摘要 HMAC |
| `CRON_SECRET` | Secret | 与以上密钥不同，用于验证每日认证数据清理任务 |
| `QQ_EMAIL_USER` | Secret | 完整 QQ 邮箱地址 |
| `QQ_EMAIL_PASS` | Secret | QQ 邮箱 SMTP 授权码，不是登录密码 |
| `SMTP_HOST`、`SMTP_PORT` | Config | `smtp.qq.com` 与 `465` |
| `EMAIL_FROM` | Config | 邮件显示发件人 |
| `NEXT_PUBLIC_SITE_URL` | Config | 生产站点地址，例如 `https://baobaodae.dpdns.org` |

前缀为 `NEXT_PUBLIC_` 的变量会打包给浏览器，因此 Vercel 要求它使用 **Config** 而非 **Secret**；它只能保存公开 URL，绝不能保存密码、授权码或连接串。

## Neon 与邮件

生产数据库使用 `vercel-app/db/migrations/0001_account.sql`、`0002_self_managed_auth.sql` 和 `0003_handle_change_schedule.sql` 所定义的表。后续改表时先新增迁移文件，再在目标 Neon 分支执行；不要直接编辑已应用的迁移。

在 Vercel 中：

1. 配置 `.env.example` 所列变量；生产和预览分别使用合适的数据库连接串与密钥。
2. QQ SMTP 使用完整 QQ 邮箱地址和 QQ 邮箱生成的 SMTP 授权码，不是 QQ 登录密码；端口必须是 465，启用 SSL。
3. 保存后用一个测试邮箱走一遍注册、收信、登录和重置密码。不要把测试邮件截图中的授权码或会话 Cookie 发到公共渠道。

## 验证码限流与清理

验证码按 `Asia/Shanghai` 自然日限流：全站每日 100 封、每小时 15 封；单 IP 每日 20 封、单邮箱每日 5 封。单 IP 或邮箱仍须间隔 60 秒，15 分钟内最多 3 封。达到任一限制时 API 返回 `429`。

`vercel-app/vercel.json` 在每天北京时间 00:10 调用 `/api/cron/auth-cleanup`。该路由仅接受 Vercel 携带的 `Authorization: Bearer $CRON_SECRET`，删除过期验证码和 24 小时前的限流记录。部署前在 Vercel Production 环境配置 `CRON_SECRET`；不要手动公开调用此路由。

## 域名与部署检查

DigitalPlat 中，根记录 `@` 的 A 记录必须指向 Vercel 域名页面给出的 IP；Vercel 若要求验证，再添加它给出的 `_vercel` TXT 记录。DNS 生效后，在 Vercel Domains 页面刷新确认状态。

每次生产部署后可做以下无敏感信息检查：

```powershell
Invoke-WebRequest https://baobaodae.dpdns.org/sign-in
Invoke-WebRequest https://baobaodae.dpdns.org/api/auth/me
```

未登录访问 `me` 返回 `user: null` 是正常现象；它说明认证路由可达，不等于邮件发送已通过。还应手动验证注册、QQ 邮件、登录、重置密码、资料更新和文章详情页的收藏切换。

## 常见构建错误

| Vercel 错误 | 原因 | 处理 |
| --- | --- | --- |
| 找不到 `dist/` | 仍配置了静态站的 `outputDirectory` | 删除静态输出配置，保留 Next.js framework 声明 |
| 找不到 `public/` 或 `STATIC_BUILD_NO_OUT_DIR` | 项目被识别为静态框架 | 确认 Root Directory 为 `vercel-app`，且根目录 `vercel.json` 声明 `nextjs` |
| `NEXT_PUBLIC_*` 不能为 Secret | Vercel 的公开变量规则 | 将该变量改为 Config；不要改动真正的 Secret 变量 |
