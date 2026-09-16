"use client";

import Link from "next/link";
import LogoutButton from "@/components/logout-button";

type User = { name: string; email: string } | null;

export default function AccountMenu({ user }: { user: User }) {
  return <details className="account-menu"><summary>{user ? user.name : "登录 / 注册"}</summary><div className="account-popover">{user ? <><strong>{user.name}</strong><span>{user.email}</span><Link href="/account">个人中心</Link><Link href="/account/settings">账号设置</Link><LogoutButton /></> : <><strong>欢迎来到 melondy101</strong><span>登录后可收藏文章、管理个人资料。</span><Link href="/sign-in">登录</Link><Link className="menu-primary" href="/sign-up">注册</Link></>}</div></details>;
}
