import { z } from "zod";

const registerInput = z.object({
  email: z.string().trim().email().max(256),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(50)
});

type User = { id: string; email: string; name: string; passwordHash?: string };
type Email = { email: string; emailLower: string };

export type AuthenticationDependencies = {
  users: {
    findByEmail(emailLower: string): Promise<User | null>;
    create(input: Email & { passwordHash: string; name: string }): Promise<User>;
    updatePassword(emailLower: string, passwordHash: string): Promise<void>;
  };
  verification: {
    send(input: Email & { purpose: "register" | "reset_password" }): Promise<{ accepted: boolean }>;
    consume(input: Email & { code: string; purpose: "register" | "reset_password" }): Promise<boolean>;
  };
  passwords: { hash(password: string): Promise<string>; verify(password: string, passwordHash: string): Promise<boolean> };
  sessions: { create(userId: string): Promise<string>; cookie(token: string): string; clear(): string };
  limit(kind: string, request: Request, emailLower?: string): Promise<boolean>;
  recordAttempt(kind: string, request: Request, emailLower?: string): Promise<void>;
};

function normalizedEmail(email: string): Email {
  const trimmed = email.trim();
  return { email: trimmed, emailLower: trimmed.toLowerCase() };
}

function withSession(body: unknown, status: number, token: string, cookie: string) {
  const response = Response.json(body, { status });
  response.headers.set("set-cookie", cookie);
  return response;
}

function purpose(value: unknown): "register" | "reset_password" | null {
  return value === "register" || value === "reset_password" ? value : null;
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function createAuthenticationHandlers(dependencies: AuthenticationDependencies) {
  return {
    async register(request: Request) {
      const parsed = registerInput.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ error: "注册信息格式不正确。" }, { status: 400 });
      const identity = normalizedEmail(parsed.data.email);
      if (!await dependencies.limit("register", request, identity.emailLower)) return Response.json({ error: "操作过于频繁，请稍后再试。" }, { status: 429 });
      if (await dependencies.users.findByEmail(identity.emailLower)) return Response.json({ error: "该邮箱已注册，请直接登录。" }, { status: 409 });
      if (!await dependencies.verification.consume({ ...identity, code: parsed.data.code, purpose: "register" })) {
        await dependencies.recordAttempt("register", request, identity.emailLower);
        return Response.json({ error: "验证码错误或已过期。" }, { status: 400 });
      }
      const user = await dependencies.users.create({ ...identity, name: parsed.data.name, passwordHash: await dependencies.passwords.hash(parsed.data.password) });
      await dependencies.recordAttempt("register", request, identity.emailLower);
      const token = await dependencies.sessions.create(user.id);
      return withSession({ user: { id: user.id, email: identity.emailLower, name: user.name } }, 201, token, dependencies.sessions.cookie(token));
    },
    async sendCode(request: Request) {
      const body = await request.json().catch(() => null) as { email?: unknown; purpose?: unknown } | null;
      const parsed = z.object({ email: z.string().trim().email().max(256) }).safeParse(body);
      const codePurpose = purpose(body?.purpose);
      if (!parsed.success || !codePurpose) return Response.json({ error: "邮箱或验证码用途不正确。" }, { status: 400 });
      const identity = normalizedEmail(parsed.data.email);
      if (!await dependencies.limit("send_code", request, identity.emailLower)) return Response.json({ error: "操作过于频繁，请稍后再试。" }, { status: 429 });
      if (codePurpose === "reset_password" && !await dependencies.users.findByEmail(identity.emailLower)) return Response.json({ ok: true });
      await dependencies.recordAttempt("send_code", request, identity.emailLower);
      const result = await dependencies.verification.send({ ...identity, purpose: codePurpose });
      return result.accepted ? Response.json({ ok: true }) : Response.json({ error: "验证码暂时无法发送。" }, { status: 503 });
    },
    async login(request: Request) {
      const parsed = z.object({ email: z.string().trim().email().max(256), password: z.string().min(8).max(256) }).safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ error: "邮箱或密码不正确，请重试。" }, { status: 400 });
      const identity = normalizedEmail(parsed.data.email);
      if (!await dependencies.limit("login", request, identity.emailLower)) return Response.json({ error: "操作过于频繁，请稍后再试。" }, { status: 429 });
      const user = await dependencies.users.findByEmail(identity.emailLower);
      if (!user?.passwordHash || !await dependencies.passwords.verify(parsed.data.password, user.passwordHash)) {
        await dependencies.recordAttempt("login", request, identity.emailLower);
        return Response.json({ error: "邮箱或密码不正确，请重试。" }, { status: 401 });
      }
      const token = await dependencies.sessions.create(user.id);
      await dependencies.recordAttempt("login", request, identity.emailLower);
      return withSession({ user: { id: user.id, email: user.email, name: user.name } }, 200, token, dependencies.sessions.cookie(token));
    },
    async resetPassword(request: Request) {
      const parsed = z.object({ email: z.string().trim().email().max(256), code: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(256) }).safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ error: "重置信息格式不正确。" }, { status: 400 });
      const identity = normalizedEmail(parsed.data.email);
      if (!await dependencies.limit("reset_password", request, identity.emailLower)) return Response.json({ error: "操作过于频繁，请稍后再试。" }, { status: 429 });
      const user = await dependencies.users.findByEmail(identity.emailLower);
      if (!user || !await dependencies.verification.consume({ ...identity, code: parsed.data.code, purpose: "reset_password" })) {
        await dependencies.recordAttempt("reset_password", request, identity.emailLower);
        return Response.json({ error: "验证码错误或已过期。" }, { status: 400 });
      }
      await dependencies.users.updatePassword(identity.emailLower, await dependencies.passwords.hash(parsed.data.password));
      const token = await dependencies.sessions.create(user.id);
      await dependencies.recordAttempt("reset_password", request, identity.emailLower);
      return withSession({ ok: true }, 200, token, dependencies.sessions.cookie(token));
    },
    logout() {
      const response = Response.json({ ok: true });
      response.headers.set("set-cookie", dependencies.sessions.clear());
      return response;
    }
  };
}
