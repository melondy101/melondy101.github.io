import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth/session";
import { accountRepository } from "@/lib/database/account-repository";
import { authRepository } from "@/lib/database/auth-repository";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/sign-in?next=/account");
  const [user, profile, favorites] = await Promise.all([authRepository.findById(userId), accountRepository.getProfile(userId), accountRepository.listFavorites(userId)]);
  if (!user) redirect("/sign-in?next=/account");
  return <main className="shell"><p className="eyebrow">Account</p><h1>{profile?.nickname || user.name || "我的账户"}</h1><p>邮箱：{user.email}</p><p>姓：{profile?.lastName || "尚未填写"}</p><p>账号：{profile?.handle || "尚未填写"}</p><p><Link href="/account/settings">账号设置 →</Link></p><LogoutButton /><h2>收藏文章</h2>{favorites.length ? <ul>{favorites.map(({ slug }) => <li key={slug}><Link href={`/writing/${slug}`}>{slug}</Link></li>)}</ul> : <p>还没有收藏。请在文章详情页收藏。</p>}</main>;
}
