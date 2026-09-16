import { createAuthenticationHandlers } from "@/lib/api/auth-handlers";
import { sendVerificationEmail } from "@/lib/auth/email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, createSession, sessionCookie } from "@/lib/auth/session";
import { authRepository } from "@/lib/database/auth-repository";

function ip(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export const authenticationHandlers = createAuthenticationHandlers({
  users: authRepository,
  verification: {
    async send({ email, emailLower, purpose }) {
      const code = await authRepository.createCode(emailLower, purpose);
      try {
        await sendVerificationEmail({ to: email, code, purpose });
        return { accepted: true };
      } catch {
        await authRepository.deleteCode(emailLower, purpose);
        return { accepted: false };
      }
    },
    consume: ({ emailLower, purpose, code }) => authRepository.consumeCode(emailLower, purpose, code)
  },
  passwords: { hash: hashPassword, verify: verifyPassword },
  sessions: { create: createSession, cookie: sessionCookie, clear: clearSessionCookie },
  limit: (kind, request, emailLower) => authRepository.allow(kind, ip(request), emailLower),
  recordAttempt: (kind, request, emailLower) => authRepository.record(kind, ip(request), emailLower)
});
