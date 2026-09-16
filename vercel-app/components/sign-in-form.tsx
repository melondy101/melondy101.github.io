"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    if (!response.ok) { setError("邮箱或密码不正确，请重试。"); return; }
    router.push(searchParams.get("next") || "/account");
    router.refresh();
  }

  return <main className="shell"><h1>登录</h1><form onSubmit={submit}><label>QQ 邮箱<input name="email" type="email" required autoComplete="email" /></label><label>密码<input name="password" type="password" minLength={8} required autoComplete="current-password" /></label><button>登录</button>{error && <p role="alert">{error}</p>}</form><p><Link href="/reset-password">忘记密码？</Link> · <Link href="/sign-up">还没有账号？注册</Link></p></main>;
}
