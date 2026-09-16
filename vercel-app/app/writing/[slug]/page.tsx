import Link from "next/link";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/favorite-button";

const articles: Record<string, { title: string; body: string }> = {
  "behavioral-residual-heat": { title: "行为的残余热量", body: "那些没有立刻结束的行动，会留下可被再次点燃的线索。" },
  "purposeful-concept-expansion": { title: "没有明确目的的概念扩张", body: "概念只有在与真实问题发生关系时，才会变成可靠的能力。" },
  "mastery-is-not-ability": { title: "掌握感不是能力", body: "熟悉并不等于能在新的情境中稳定地完成。" },
  "thinking-is-not-action": { title: "思考代替行动", body: "把下一步做得具体，才不会让思考成为行动的替代品。" },
  "lagrange-duality": { title: "Where the Name ‘Lagrange Duality’ Comes From", body: "A short note on the historical and mathematical origin of the term." }
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();
  return <main className="shell"><Link href="/writing">← Writing</Link><p className="eyebrow">Article</p><h1>{article.title}</h1><p>{article.body}</p><FavoriteButton slug={slug} /></main>;
}
