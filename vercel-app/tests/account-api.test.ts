import { describe, expect, it } from "vitest";
import { createFavoriteHandler } from "../lib/api/favorite-handler";
import { createProfileHandler } from "../lib/api/profile-handler";

const session = { user: { id: "user_1" } };

describe("account API boundaries", () => {
  it("rejects an unauthenticated profile update", async () => {
    const handler = createProfileHandler({
      getSession: async () => null,
      update: async () => { throw new Error("must not update"); }
    });

    const response = await handler(new Request("http://site.test/api/profile", {
      method: "POST",
      body: JSON.stringify({ lastName: "黄", nickname: "毅", handle: "melondy101" })
    }));

    expect(response.status).toBe(401);
  });

  it("updates only the authenticated user's valid profile", async () => {
    let received: unknown;
    const handler = createProfileHandler({
      getSession: async () => session,
      update: async (userId, profile) => { received = { userId, profile }; return { ...profile, userId }; }
    });

    const response = await handler(new Request("http://site.test/api/profile", {
      method: "POST",
      body: JSON.stringify({ lastName: "黄", nickname: "毅", handle: "melondy101" })
    }));

    expect(response.status).toBe(200);
    expect(received).toEqual({ userId: "user_1", profile: { lastName: "黄", nickname: "毅", handle: "melondy101" } });
  });

  it("rejects unauthenticated favorites and toggles one favorite for the current user", async () => {
    const unauthenticated = createFavoriteHandler({
      getSession: async () => null,
      toggle: async () => { throw new Error("must not toggle"); }
    });
    expect((await unauthenticated(new Request("http://site.test/api/articles/a/favorite", { method: "POST" }), "a")).status).toBe(401);

    const calls: Array<[string, string]> = [];
    const handler = createFavoriteHandler({
      getSession: async () => session,
      toggle: async (userId, slug) => { calls.push([userId, slug]); return { favorited: true }; }
    });
    const response = await handler(new Request("http://site.test/api/articles/article-a/favorite", { method: "POST" }), "article-a");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ favorited: true });
    expect(calls).toEqual([["user_1", "article-a"]]);
  });
});
