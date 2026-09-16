import { describe, expect, it } from "vitest";
import { createAuthenticationHandlers } from "../lib/api/auth-handlers";

const verification = {
  async send() { return { accepted: true }; },
  async consume() { return true; }
};

describe("authentication API boundaries", () => {
  it("registers a verified email and creates a session", async () => {
    const calls: string[] = [];
    const handlers = createAuthenticationHandlers({
      users: {
        findByEmail: async () => null,
        create: async ({ email }) => ({ id: "user-1", email, name: "毅" }),
        updatePassword: async () => undefined
      },
      verification,
      passwords: { hash: async () => "hash", verify: async () => false },
      sessions: { create: async () => "signed-session", cookie: (token) => `session=${token}`, clear: () => "" },
      limit: async () => true,
      recordAttempt: async (kind) => { calls.push(kind); }
    });

    const response = await handlers.register(new Request("http://site.test/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "Yi@QQ.com", code: "123456", password: "password123", name: "毅" })
    }));

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("session=signed-session");
    expect(await response.json()).toEqual({ user: { id: "user-1", email: "yi@qq.com", name: "毅" } });
    expect(calls).toEqual(["register"]);
  });

  it("rejects registration with an invalid verification code", async () => {
    const handlers = createAuthenticationHandlers({
      users: { findByEmail: async () => null, create: async () => { throw new Error("must not create"); }, updatePassword: async () => undefined },
      verification: { ...verification, consume: async () => false },
      passwords: { hash: async () => "hash", verify: async () => false },
      sessions: { create: async () => "signed-session", cookie: (token) => `session=${token}`, clear: () => "" },
      limit: async () => true,
      recordAttempt: async () => undefined
    });

    const response = await handlers.register(new Request("http://site.test/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "yi@qq.com", code: "000000", password: "password123", name: "毅" })
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "验证码错误或已过期。" });
  });
});
