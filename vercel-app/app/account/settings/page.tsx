import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileSettingsForm from "@/components/profile-settings-form";
import { currentUserId } from "@/lib/auth/session";
import { accountRepository } from "@/lib/database/account-repository";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/sign-in?next=/account/settings");
  const profile = await accountRepository.getProfile(userId);
  return <main className="shell"><Link href="/account">← 个人中心</Link><p className="eyebrow">Settings</p><h1>账号设置</h1><ProfileSettingsForm profile={profile} /></main>;
}
