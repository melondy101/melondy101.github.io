import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { sessionCookieName } from "@/lib/auth/session";

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  const secret = process.env.AUTH_JWT_SECRET;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch { /* redirect below */ }
  }
  return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
}

export const config = { matcher: ["/account/:path*"] };
