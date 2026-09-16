import { z } from "zod";

const profileInput = z.object({
  lastName: z.string().trim().min(1).max(50),
  nickname: z.string().trim().min(1).max(50),
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,29}$/)
});

type Session = { user: { id: string } } | null;
type Profile = z.infer<typeof profileInput>;

export function createProfileHandler(dependencies: {
  getSession: () => Promise<Session>;
  update: (userId: string, profile: Profile) => Promise<unknown>;
}) {
  return async function handler(request: Request) {
    const session = await dependencies.getSession();
    if (!session) return Response.json({ error: "请先登录。" }, { status: 401 });

    const result = profileInput.safeParse(await request.json().catch(() => null));
    if (!result.success) return Response.json({ error: "资料格式不正确。" }, { status: 400 });

    try {
      const profile = await dependencies.update(session.user.id, result.data);
      return Response.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message === "HANDLE_TAKEN") {
        return Response.json({ error: "该账号已被使用。" }, { status: 409 });
      }
      return Response.json({ error: "资料暂时无法保存。" }, { status: 500 });
    }
  };
}
