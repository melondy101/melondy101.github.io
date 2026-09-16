# 自管 QQ SMTP 认证实施计划

> 设计依据：[自管 QQ SMTP 认证迁移设计](../specs/2026-09-16-self-managed-qq-smtp-auth-design.md)。

## 串行前置条件

1. 在 `vercel-app` 安装 `jose`、`nodemailer` 与必要类型，不添加 Neon Auth 的替代平台依赖。
2. 先完成数据库迁移，再切换应用路由；迁移在当前无用户前提下清理 Neon Auth 关联资料与收藏。
3. 所有 API 与页面改造完成后，才移除 Neon Auth 依赖及环境变量文档。

## 实施步骤

1. 新建 `lib/auth/contracts.ts`，定义可替换的 `SessionService`、`VerificationService`、`Mailer` 与 `UserRepository` 接口；路由只能依赖这些契约。
2. 在 `lib/auth/session.ts` 实现 JWT Cookie 适配器，在 `lib/auth/password.ts` 实现 scrypt 哈希/校验，在 `lib/auth/email.ts` 实现 QQ SMTP 适配器；Cookie 属性集中在单处。
3. 扩展 SQL 迁移：创建 `users`、`email_verifications`、`auth_attempts`，将 `profiles.auth_user_id` 关联改为本站用户 UUID，并为过期查询、邮箱/用途和限流查询创建索引。
4. 将 `account-repository.ts` 拆分/调整为 PostgreSQL 用户、验证码/限流与业务资料/收藏仓库实现。接口层不暴露 Neon SQL 或 Nodemailer 类型。
5. 实现 `send-code`、`register`、`login`、`forgot-password`、`reset-password`、`logout`、`me` 路由；为输入校验、验证码消费和限流创建共享服务。SMTP 失败时回滚验证码记录。
6. 替换 `proxy.ts` 与 Neon catch-all 路由：账户页在服务端按本站会话重定向；资料、收藏 API 由共享会话辅助函数鉴权。
7. 更新注册、登录及新增重置密码页面；新增全局页头的右上角身份入口。访客不获得临时账号，也不能收藏。
8. 更新 `.env.example`、运维和集成文档，列出新的密钥名、QQ 邮箱 465 SSL 设置、Vercel 配置步骤及本地验证命令；不写入任何真实值。
9. 添加/更新测试，依次验证纯函数、仓库替身下的认证 API、受保护资料与收藏、右上角入口状态。
10. 运行 `npm test` 与 `npm run build`（`vercel-app`），再运行根目录 `npm run build`；执行 `git diff --check`，并检查 Git 未跟踪/已跟踪文件不含秘密。

## 可并行窗口

仅在步骤 4 完成之后，步骤 6（会话保护）与步骤 7（页面改造）可并行；其余步骤依赖上一步的契约或迁移结果，保持串行以避免认证边界漂移。

## 交付验收

- 访客可浏览站点，右上角显示登录/注册，且不会创建账号或收藏。
- 新用户收到 QQ SMTP 注册验证码，完成注册后可登录并进入个人主页。
- 忘记密码不会泄露邮箱存在性；有效验证码能重置密码并建立新会话。
- 代码仅通过四个可替换契约接触 Cookie、邮件、验证码和用户数据；更换 PostgreSQL 部署仅改连接配置，更换数据库类型或邮件服务仅替换对应适配器。
- 静态 GitHub Pages 与 Vercel 动态站均构建成功，秘密不进入仓库或日志。
