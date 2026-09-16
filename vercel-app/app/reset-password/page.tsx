"use client";

import { FormEvent, MouseEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function sendCode(event: MouseEvent<HTMLButtonElement>) {
    const email = new FormData(event.currentTarget.form ?? undefined).get("email");
    const response = await fetch("/api/auth/send-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, purpose: "reset_password" }) });
    if (!response.ok) { setError("验证码暂时无法发送，请稍后重试。"); return; }
    setMessage("如该邮箱已注册，验证码已发送。");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), code: form.get("code"), password: form.get("password") }) });
    if (!response.ok) { setError("验证码错误、已过期，或重置暂时失败。"); return; }
    router.push("/account"); router.refresh();
  }
  return <main className="shell"><h1>重置密码</h1><form onSubmit={submit}><label>QQ 邮箱<input name="email" type="email" required autoComplete="email" /></label><button type="button" onClick={sendCode}>获取验证码</button><label>验证码<input name="code" inputMode="numeric" pattern="[0-9]{6}" required /></label><label>新密码<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label><button>重置密码</button>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</form><p><Link href="/sign-in">返回登录</Link></p></main>;
}
