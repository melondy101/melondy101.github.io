import { createHmac, randomInt } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { memoryStore, type MockUser } from "./in-memory-store";

type Purpose = "register" | "reset_password";
type User = { id: string; email: string; name: string; passwordHash: string };

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

function digest(value: string) {
  const secret = process.env.AUTH_CODE_SECRET || "melondy101_dev_auth_secret_key";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export const authRepository = {
  async findByEmail(emailLower: string): Promise<User | null> {
    const sql = database();
    if (sql) {
      try {
        const rows = await sql`select id, email, name, password_hash as "passwordHash" from users where email_lower = ${emailLower}`;
        return (rows[0] as User | undefined) ?? null;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const id = memoryStore.usersByEmail.get(emailLower);
    if (!id) return null;
    const user = memoryStore.users.get(id);
    return user ?? null;
  },

  async findById(id: string): Promise<Omit<User, "passwordHash"> | null> {
    const sql = database();
    if (sql) {
      try {
        const rows = await sql`select id, email, name from users where id = ${id}`;
        return (rows[0] as Omit<User, "passwordHash"> | undefined) ?? null;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const user = memoryStore.users.get(id);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  },

  async create(input: { email: string; emailLower: string; passwordHash: string; name: string }) {
    const sql = database();
    if (sql) {
      try {
        const rows = await sql`with inserted_user as (
          insert into users (email, email_lower, password_hash, name)
          values (${input.email}, ${input.emailLower}, ${input.passwordHash}, ${input.name})
          returning id, email, name
        ), inserted_profile as (
          insert into profiles (auth_user_id, last_name, nickname, handle)
          select id, '未填写', name, 'u_' || left(replace(id::text, '-', ''), 20) from inserted_user
        ) select id, email, name from inserted_user`;
        return rows[0] as Omit<User, "passwordHash">;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mockUser: MockUser = {
      id,
      email: input.email,
      emailLower: input.emailLower,
      name: input.name,
      passwordHash: input.passwordHash
    };
    memoryStore.users.set(id, mockUser);
    memoryStore.usersByEmail.set(input.emailLower, id);
    memoryStore.profiles.set(id, {
      authUserId: id,
      lastName: "未填写",
      nickname: input.name,
      handle: `u_${id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`
    });
    return { id, email: input.email, name: input.name };
  },

  async updatePassword(emailLower: string, passwordHash: string) {
    const sql = database();
    if (sql) {
      try {
        await sql`update users set password_hash = ${passwordHash}, updated_at = now() where email_lower = ${emailLower}`;
        return;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const id = memoryStore.usersByEmail.get(emailLower);
    if (id && memoryStore.users.has(id)) {
      memoryStore.users.get(id)!.passwordHash = passwordHash;
    }
  },

  async createCode(emailLower: string, purpose: Purpose) {
    const code = randomInt(100000, 1000000).toString();
    const sql = database();
    if (sql) {
      try {
        await sql`delete from email_verifications where email_lower = ${emailLower} and purpose = ${purpose}`;
        await sql`insert into email_verifications (email_lower, purpose, code_hash, expires_at) values (${emailLower}, ${purpose}, ${digest(`${purpose}:${emailLower}:${code}`)}, now() + interval '10 minutes')`;
        return code;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    memoryStore.verifications.set(`${purpose}:${emailLower}`, {
      id: `ver_${Date.now()}`,
      emailLower,
      purpose,
      code,
      attempts: 0,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    return code;
  },

  async deleteCode(emailLower: string, purpose: Purpose) {
    const sql = database();
    if (sql) {
      try {
        await sql`delete from email_verifications where email_lower = ${emailLower} and purpose = ${purpose}`;
        return;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    memoryStore.verifications.delete(`${purpose}:${emailLower}`);
  },

  async consumeCode(emailLower: string, purpose: Purpose, code: string) {
    const sql = database();
    if (sql) {
      try {
        const rows = await sql`select id, code_hash as "codeHash", attempts from email_verifications where email_lower = ${emailLower} and purpose = ${purpose} and expires_at > now() order by created_at desc limit 1`;
        const record = rows[0] as { id: string; codeHash: string; attempts: number } | undefined;
        if (!record || record.attempts >= 5 || record.codeHash !== digest(`${purpose}:${emailLower}:${code}`)) {
          if (record) await sql`update email_verifications set attempts = attempts + 1 where id = ${record.id}`;
          return false;
        }
        await sql`delete from email_verifications where id = ${record.id}`;
        return true;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const record = memoryStore.verifications.get(`${purpose}:${emailLower}`);
    if (!record || record.expiresAt < Date.now() || record.attempts >= 5 || record.code !== code) {
      if (record) record.attempts++;
      return false;
    }
    memoryStore.verifications.delete(`${purpose}:${emailLower}`);
    return true;
  },

  async allow(kind: string, ip: string, emailLower?: string) {
    const sql = database();
    if (sql) {
      try {
        const emailHash = emailLower ? digest(`email:${emailLower}`) : null;
        const rows = await sql`select
          count(*) filter (where attempted_at > now() - interval '15 minutes' and (ip = ${ip} or (${emailHash}::text is not null and email_hash = ${emailHash})))::int as "windowCount",
          count(*) filter (where attempted_at > now() - interval '60 seconds' and (ip = ${ip} or (${emailHash}::text is not null and email_hash = ${emailHash})))::int as "recentCount",
          count(*) filter (where attempted_at > now() - interval '1 hour')::int as "globalHourlyCount",
          count(*) filter (where attempted_at >= date_trunc('day', now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai')::int as "globalDailyCount",
          count(*) filter (where attempted_at >= date_trunc('day', now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai' and ip = ${ip})::int as "ipDailyCount",
          count(*) filter (where attempted_at >= date_trunc('day', now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai' and (${emailHash}::text is not null and email_hash = ${emailHash}))::int as "emailDailyCount"
          from auth_attempts where kind = ${kind}`;
        const record = rows[0] as { windowCount: number; recentCount: number; globalHourlyCount: number; globalDailyCount: number; ipDailyCount: number; emailDailyCount: number };
        if (kind === "send_code") return Number(record.windowCount) < 3 && Number(record.recentCount) === 0 && Number(record.globalHourlyCount) < 15 && Number(record.globalDailyCount) < 100 && Number(record.ipDailyCount) < 20 && Number(record.emailDailyCount) < 5;
        return Number(record.windowCount) < 10;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    return true;
  },

  async record(kind: string, ip: string, emailLower?: string) {
    const sql = database();
    if (sql) {
      try {
        await sql`insert into auth_attempts (ip, email_hash, kind) values (${ip}, ${emailLower ? digest(`email:${emailLower}`) : null}, ${kind})`;
        return;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    memoryStore.attempts.push({ ip, emailLower, kind, at: Date.now() });
  },

  async cleanupExpiredAuthData() {
    const sql = database();
    if (sql) {
      try {
        const expiredCodes = await sql`delete from email_verifications where expires_at < now()`;
        const oldAttempts = await sql`delete from auth_attempts where attempted_at < now() - interval '24 hours'`;
        return { expiredCodes: expiredCodes.length, oldAttempts: oldAttempts.length };
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    return { expiredCodes: 0, oldAttempts: 0 };
  }
};
