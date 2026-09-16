import { createHmac, randomInt } from "node:crypto";
import { neon } from "@neondatabase/serverless";

type Purpose = "register" | "reset_password";
type User = { id: string; email: string; name: string; passwordHash: string };

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

function digest(value: string) {
  const secret = process.env.AUTH_CODE_SECRET;
  if (!secret) throw new Error("AUTH_CODE_SECRET is not configured");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export const authRepository = {
  async findByEmail(emailLower: string): Promise<User | null> {
    const rows = await database()`select id, email, name, password_hash as "passwordHash" from users where email_lower = ${emailLower}`;
    return rows[0] as User | undefined ?? null;
  },
  async findById(id: string): Promise<Omit<User, "passwordHash"> | null> {
    const rows = await database()`select id, email, name from users where id = ${id}`;
    return rows[0] as Omit<User, "passwordHash"> | undefined ?? null;
  },
  async create(input: { email: string; emailLower: string; passwordHash: string; name: string }) {
    const rows = await database()`insert into users (email, email_lower, password_hash, name) values (${input.email}, ${input.emailLower}, ${input.passwordHash}, ${input.name}) returning id, email, name`;
    return rows[0] as Omit<User, "passwordHash">;
  },
  async updatePassword(emailLower: string, passwordHash: string) {
    await database()`update users set password_hash = ${passwordHash}, updated_at = now() where email_lower = ${emailLower}`;
  },
  async createCode(emailLower: string, purpose: Purpose) {
    const code = randomInt(100000, 1000000).toString();
    const sql = database();
    await sql`delete from email_verifications where email_lower = ${emailLower} and purpose = ${purpose}`;
    await sql`insert into email_verifications (email_lower, purpose, code_hash, expires_at) values (${emailLower}, ${purpose}, ${digest(`${purpose}:${emailLower}:${code}`)}, now() + interval '10 minutes')`;
    return code;
  },
  async deleteCode(emailLower: string, purpose: Purpose) {
    await database()`delete from email_verifications where email_lower = ${emailLower} and purpose = ${purpose}`;
  },
  async consumeCode(emailLower: string, purpose: Purpose, code: string) {
    const sql = database();
    const rows = await sql`select id, code_hash as "codeHash", attempts from email_verifications where email_lower = ${emailLower} and purpose = ${purpose} and expires_at > now() order by created_at desc limit 1`;
    const record = rows[0] as { id: string; codeHash: string; attempts: number } | undefined;
    if (!record || record.attempts >= 5 || record.codeHash !== digest(`${purpose}:${emailLower}:${code}`)) {
      if (record) await sql`update email_verifications set attempts = attempts + 1 where id = ${record.id}`;
      return false;
    }
    await sql`delete from email_verifications where id = ${record.id}`;
    return true;
  },
  async allow(kind: string, ip: string, emailLower?: string) {
    const sql = database();
    const emailHash = emailLower ? digest(`email:${emailLower}`) : null;
    const rows = await sql`select count(*) filter (where attempted_at > now() - interval '15 minutes')::int as "windowCount", count(*) filter (where attempted_at > now() - interval '60 seconds')::int as "recentCount" from auth_attempts where kind = ${kind} and (ip = ${ip} or (${emailHash}::text is not null and email_hash = ${emailHash}))`;
    const record = rows[0] as { windowCount: number; recentCount: number };
    if (kind === "send_code") return Number(record.windowCount) < 3 && Number(record.recentCount) === 0;
    return Number(record.windowCount) < 10;
  },
  async record(kind: string, ip: string, emailLower?: string) {
    await database()`insert into auth_attempts (ip, email_hash, kind) values (${ip}, ${emailLower ? digest(`email:${emailLower}`) : null}, ${kind})`;
  }
};
