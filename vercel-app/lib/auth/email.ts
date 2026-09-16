import nodemailer from "nodemailer";

export async function sendVerificationEmail(input: { to: string; code: string; purpose: "register" | "reset_password" }) {
  const user = process.env.QQ_EMAIL_USER;
  const pass = process.env.QQ_EMAIL_PASS;
  if (!user || !pass) throw new Error("QQ SMTP is not configured");
  const reset = input.purpose === "reset_password";
  const action = reset ? "重置密码" : "注册账号";
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.qq.com", port: Number(process.env.SMTP_PORT || 465), secure: true, auth: { user, pass } });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to: input.to,
    subject: `【melondy101】${action}验证码`,
    text: `你正在${action}，验证码为 ${input.code}，10 分钟内有效。若非本人操作，请忽略此邮件。`,
    html: `<main style="padding:24px;font-family:sans-serif"><h2>${action}</h2><p>验证码：</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${input.code}</p><p>10 分钟内有效。若非本人操作，请忽略此邮件。</p></main>`
  });
}
