import { createFavoriteHandler } from "@/lib/api/favorite-handler";
import { currentUserId } from "@/lib/auth/session";
import { accountRepository } from "@/lib/database/account-repository";

const handler = createFavoriteHandler({
  getSession: async () => {
    const id = await currentUserId();
    return id ? { user: { id } } : null;
  },
  toggle: accountRepository.toggleFavorite
});

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handler(request, slug);
}
