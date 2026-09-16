import Link from "next/link";
import { currentUserId } from "@/lib/auth/session";
import { authRepository } from "@/lib/database/auth-repository";
import AccountMenu from "@/components/account-menu";

export default async function SiteHeader() {
  const id = await currentUserId();
  const user = id ? await authRepository.findById(id) : null;
  return <header className="site-header"><Link className="wordmark" href="/">melondy101</Link><nav><Link href="/#projects">Projects</Link><Link href="/#writing">Writing</Link><Link href="/#about">About</Link><AccountMenu user={user ? { name: user.name, email: user.email } : null} /></nav></header>;
}
