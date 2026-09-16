"use client";

import { FormEvent, MouseEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function sendCode(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const email = new FormData(form ?? undefined).get("email");
    const response = await fetch("/api/auth/send-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, purpose: "register" }) });
    if (!response.ok) { setError("验证码暂时无法发送，请稍后重试。"); return; }
    setMessage("验证码已发送，请查看 QQ 邮箱。");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = { email: form.get("email"), code: form.get("code"), password: form.get("password"), name: form.get("nickname") };
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { setError("暂时无法完成注册，请检查邮箱、验证码和密码后重试。"); return; }
    const profile = { lastName: form.get("lastName"), nickname: form.get("nickname"), handle: form.get("handle") };
    const profileResponse = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
    if (!profileResponse.ok) { setError("账户已创建，请登录后补充资料。"); return; }
    setMessage("注册成功。");
    router.push("/account");
  }

  return <main className="shell"><h1>注册</h1><form onSubmit={submit}><label>QQ 邮箱<input name="email" type="email" required autoComplete="email" /></label><button type="button" onClick={sendCode}>获取验证码</button><label>验证码<input name="code" inputMode="numeric" pattern="[0-9]{6}" required /></label><label>密码<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label><label>姓<input name="lastName" required /></label><label>昵称<input name="nickname" required /></label><label>账号<input name="handle" pattern="[a-zA-Z0-9_-]{3,30}" required /></label><button>注册</button>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</form><p><Link href="/sign-in">已有账号？登录</Link></p></main>;
}
