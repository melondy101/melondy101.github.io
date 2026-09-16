import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { accountRepository } from "@/lib/database/account-repository";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/sign-in?next=/account");
  const [profile, favorites] = await Promise.all([accountRepository.getProfile(data.user.id), accountRepository.listFavorites(data.user.id)]);
  return <main className="shell"><p className="eyebrow">Account</p><h1>{profile?.nickname || data.user.name || "我的账户"}</h1><p>邮箱：{data.user.email}</p><p>姓：{profile?.lastName || "尚未填写"}</p><p>账号：{profile?.handle || "尚未填写"}</p><h2>收藏文章</h2>{favorites.length ? <ul>{favorites.map(({ slug }) => <li key={slug}><Link href={`/writing/${slug}`}>{slug}</Link></li>)}</ul> : <p>还没有收藏。请在文章详情页收藏。</p>}</main>;
}
