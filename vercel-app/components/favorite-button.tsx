"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function FavoriteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    const response = await fetch(`/api/articles/${slug}/favorite`, { method: "POST" });
    if (response.status === 401) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!response.ok) { setMessage("暂时无法更新收藏，请稍后再试。"); return; }
    const result = await response.json() as { favorited: boolean };
    setFavorited(result.favorited);
    setMessage(result.favorited ? "已收藏。" : "已取消收藏。 ");
  }

  return <div><button type="button" onClick={toggle}>{favorited ? "取消收藏" : "登录后收藏"}</button>{message && <p role="status">{message}</p>}</div>;
}
