import { createProfileHandler } from "@/lib/api/profile-handler";
import { currentUserId } from "@/lib/auth/server";
import { accountRepository } from "@/lib/database/account-repository";

const handler = createProfileHandler({
  getSession: async () => {
    const id = await currentUserId();
    return id ? { user: { id } } : null;
  },
  update: accountRepository.updateProfile
});

export const POST = handler;
