import Link from "next/link";

export default function HomePage() {
  return <main className="shell"><p className="eyebrow">黄毅 / Independent developer</p><h1>一些还在变成现实的想法。</h1><p>动态站已准备好支持账户、资料和文章收藏。</p><p><Link href="/writing">阅读文章</Link> · <Link href="/sign-in">登录</Link></p></main>;
}
