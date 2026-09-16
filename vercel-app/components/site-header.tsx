import Link from "next/link";
import { currentUserId } from "@/lib/auth/session";
import { authRepository } from "@/lib/database/auth-repository";

export default async function SiteHeader() {
  const id = await currentUserId();
  const user = id ? await authRepository.findById(id) : null;
  return <header className="site-header"><Link href="/">melondy101</Link><nav>{user ? <Link href="/account">{user.name}</Link> : <><Link href="/sign-in">登录</Link><Link href="/sign-up">注册</Link></>}</nav></header>;
}
