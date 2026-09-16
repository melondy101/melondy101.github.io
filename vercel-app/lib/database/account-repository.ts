import { neon } from "@neondatabase/serverless";

type ProfileInput = { lastName: string; nickname: string; handle: string };

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export const accountRepository = {
  async getProfile(authUserId: string) {
    const sql = database();
    const rows = await sql`select last_name as "lastName", nickname, handle from profiles where auth_user_id = ${authUserId}`;
    return (rows[0] as { lastName: string; nickname: string; handle: string } | undefined) ?? null;
  },

  async listFavorites(authUserId: string) {
    const sql = database();
    const rows = await sql`
      select article_slug as slug from article_favorites
      where profile_id = (select id from profiles where auth_user_id = ${authUserId})
      order by created_at desc
    `;
    return rows as Array<{ slug: string }>;
  },
  async updateProfile(authUserId: string, profile: ProfileInput) {
    const sql = database();
    try {
      const rows = await sql`
        insert into profiles (auth_user_id, last_name, nickname, handle)
        values (${authUserId}, ${profile.lastName}, ${profile.nickname}, ${profile.handle})
        on conflict (auth_user_id) do update set
          last_name = excluded.last_name,
          nickname = excluded.nickname,
          handle = excluded.handle,
          updated_at = now()
        returning auth_user_id as "userId", last_name as "lastName", nickname, handle
      `;
      return rows[0];
    } catch (error) {
      if (String(error).includes("profiles_handle_key")) throw new Error("HANDLE_TAKEN");
      throw error;
    }
  },

  async toggleFavorite(authUserId: string, articleSlug: string) {
    const sql = database();
    const profiles = await sql`select id from profiles where auth_user_id = ${authUserId}`;
    const profile = profiles[0] as { id: string } | undefined;
    if (!profile) throw new Error("PROFILE_REQUIRED");

    const existing = await sql`select id from article_favorites where profile_id = ${profile.id} and article_slug = ${articleSlug}`;
    if (existing.length) {
      await sql`delete from article_favorites where id = ${(existing[0] as { id: string }).id}`;
      return { favorited: false };
    }
    await sql`insert into article_favorites (profile_id, article_slug) values (${profile.id}, ${articleSlug})`;
    return { favorited: true };
  }
};
