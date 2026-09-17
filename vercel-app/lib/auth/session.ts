import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const maxAge = 30 * 24 * 60 * 60;

export function sessionCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-session" : "session";
}

function secret() {
  const value = process.env.AUTH_JWT_SECRET || "melondy101_dev_auth_jwt_secret_key_min_32_chars";
  return new TextEncoder().encode(value);
}

export async function createSession(userId: string) {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("30d").sign(secret());
}

export async function currentUserId() {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret())).payload.sub ?? null;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return `${sessionCookieName()}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${sessionCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
