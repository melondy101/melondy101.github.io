import { neon } from "@neondatabase/serverless";
import { memoryStore } from "./in-memory-store";

type ProfileInput = { lastName: string; nickname: string; handle: string };

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export const accountRepository = {
  async getProfile(authUserId: string) {
    const sql = database();
    if (sql) {
      try {
        const rows = await sql`select last_name as "lastName", nickname, handle from profiles where auth_user_id = ${authUserId}`;
        return (rows[0] as { lastName: string; nickname: string; handle: string } | undefined) ?? null;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const profile = memoryStore.profiles.get(authUserId);
    if (profile) {
      return { lastName: profile.lastName, nickname: profile.nickname, handle: profile.handle };
    }
    const user = memoryStore.users.get(authUserId);
    if (user) {
      const defaultProfile = {
        lastName: "未填写",
        nickname: user.name,
        handle: `u_${authUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`
      };
      memoryStore.profiles.set(authUserId, { authUserId, ...defaultProfile });
      return defaultProfile;
    }
    return null;
  },

  async listFavorites(authUserId: string) {
    const sql = database();
    if (sql) {
      try {
        const rows = await sql`
          select article_slug as slug from article_favorites
          where profile_id = (select id from profiles where auth_user_id = ${authUserId})
          order by created_at desc
        `;
        return rows as Array<{ slug: string }>;
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    const userFavs = memoryStore.favorites.get(authUserId);
    if (!userFavs) return [];
    return Array.from(userFavs).map((slug) => ({ slug }));
  },

  async updateProfile(authUserId: string, profile: ProfileInput) {
    const sql = database();
    if (sql) {
      try {
        const existingRows = await sql`select handle, handle_updated_at is not null and handle_updated_at >= date_trunc('month', now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai' as "handleChangeLocked" from profiles where auth_user_id = ${authUserId}`;
        const existing = existingRows[0] as { handle: string; handleChangeLocked: boolean } | undefined;
        if (existing && existing.handle !== profile.handle && existing.handleChangeLocked) {
          throw new Error("HANDLE_CHANGE_LIMIT");
        }
        const rows = await sql`
          insert into profiles (auth_user_id, last_name, nickname, handle)
          values (${authUserId}, ${profile.lastName}, ${profile.nickname}, ${profile.handle})
          on conflict (auth_user_id) do update set
            last_name = excluded.last_name,
            nickname = excluded.nickname,
            handle = excluded.handle,
            handle_updated_at = case when profiles.handle <> excluded.handle then now() else profiles.handle_updated_at end,
            updated_at = now()
          returning auth_user_id as "userId", last_name as "lastName", nickname, handle
        `;
        return rows[0];
      } catch (error) {
        if (String(error).includes("profiles_handle_key")) throw new Error("HANDLE_TAKEN");
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", error);
      }
    }
    memoryStore.profiles.set(authUserId, {
      authUserId,
      lastName: profile.lastName,
      nickname: profile.nickname,
      handle: profile.handle,
      handleUpdatedAt: new Date()
    });
    return { userId: authUserId, lastName: profile.lastName, nickname: profile.nickname, handle: profile.handle };
  },

  async toggleFavorite(authUserId: string, articleSlug: string) {
    const sql = database();
    if (sql) {
      try {
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
      } catch (err) {
        console.warn("[AI Studio] Database connection failed, falling back to in-memory store", err);
      }
    }
    let favs = memoryStore.favorites.get(authUserId);
    if (!favs) {
      favs = new Set();
      memoryStore.favorites.set(authUserId, favs);
    }
    if (favs.has(articleSlug)) {
      favs.delete(articleSlug);
      return { favorited: false };
    }
    favs.add(articleSlug);
    return { favorited: true };
  }
};
