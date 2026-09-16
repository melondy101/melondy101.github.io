import { currentUserId } from "@/lib/auth/session";
import { authRepository } from "@/lib/database/auth-repository";

export const runtime = "nodejs";

export async function GET() {
  const id = await currentUserId();
  if (!id) return Response.json({ user: null });
  return Response.json({ user: await authRepository.findById(id) });
}
