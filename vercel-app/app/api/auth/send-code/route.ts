import { authenticationHandlers } from "@/lib/auth/runtime";

export const runtime = "nodejs";
export const POST = authenticationHandlers.sendCode;
