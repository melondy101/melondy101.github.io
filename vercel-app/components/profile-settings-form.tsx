"use client";

import { FormEvent, useState } from "react";

export default function ProfileSettingsForm({ profile }: { profile: { lastName: string; nickname: string; handle: string } | null }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lastName: form.get("lastName"), nickname: form.get("nickname"), handle: form.get("handle") }) });
    setMessage(response.ok ? "设置已保存。" : "暂时无法保存，请检查账号格式后重试。");
  }
  return <form onSubmit={submit}><label>姓<input name="lastName" defaultValue={profile?.lastName === "未填写" ? "" : profile?.lastName} required /></label><label>昵称<input name="nickname" defaultValue={profile?.nickname} required /></label><label>公开账号<input name="handle" defaultValue={profile?.handle} pattern="[a-zA-Z0-9_-]{3,30}" required /><small>自动生成的默认账号可修改；首次修改不限时间，此后每个自然月最多修改一次。</small></label><button>保存设置</button>{message && <p role="status">{message}</p>}</form>;
}
