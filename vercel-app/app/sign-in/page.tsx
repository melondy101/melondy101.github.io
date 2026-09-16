import { Suspense } from "react";
import SignInForm from "@/components/sign-in-form";

export default function SignInPage() {
  return <Suspense fallback={<main className="shell">正在加载登录页…</main>}><SignInForm /></Suspense>;
}
