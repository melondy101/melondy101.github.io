"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = { email: form.get("email"), password: form.get("password"), name: form.get("nickname") };
    const response = await fetch("/api/auth/sign-up/email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { setError("暂时无法完成注册，请检查邮箱和密码后重试。"); return; }
    const profile = { lastName: form.get("lastName"), nickname: form.get("nickname"), handle: form.get("handle") };
    const profileResponse = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
    if (!profileResponse.ok) { setError("账户已创建，请登录后补充资料。"); return; }
    setMessage("注册成功，请在 QQ 邮箱中完成验证。");
    router.push("/account");
  }

  return <main className="shell"><h1>注册</h1><form onSubmit={submit}><label>QQ 邮箱<input name="email" type="email" required autoComplete="email" /></label><label>密码<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label><label>姓<input name="lastName" required /></label><label>昵称<input name="nickname" required /></label><label>账号<input name="handle" pattern="[a-zA-Z0-9_-]{3,30}" required /></label><button>注册并发送验证</button>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</form><p><Link href="/sign-in">已有账号？登录</Link></p></main>;
}
