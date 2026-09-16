import { timingSafeEqual } from "node:crypto";
import { authRepository } from "@/lib/database/auth-repository";

export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = secret ? Buffer.from(`Bearer ${secret}`) : null;
  const received = Buffer.from(request.headers.get("authorization") || "");
  return Boolean(expected && expected.length === received.length && timingSafeEqual(expected, received));
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "未授权" }, { status: 401 });
  return Response.json({ ok: true, ...(await authRepository.cleanupExpiredAuthData()) });
}
