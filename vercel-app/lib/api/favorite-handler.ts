type Session = { user: { id: string } } | null;

export function createFavoriteHandler(dependencies: {
  getSession: () => Promise<Session>;
  toggle: (userId: string, slug: string) => Promise<{ favorited: boolean }>;
}) {
  return async function handler(_request: Request, slug: string) {
    const session = await dependencies.getSession();
    if (!session) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (!/^[a-z0-9-]+$/.test(slug)) return Response.json({ error: "文章不存在。" }, { status: 404 });
    return Response.json(await dependencies.toggle(session.user.id, slug));
  };
}
