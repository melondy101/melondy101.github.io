import Link from "next/link";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/favorite-button";
import { getArticle, getRelatedArticles } from "@/lib/articles";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) notFound();

  const relatedArticles = getRelatedArticles(slug, 3);

  return (
    <main className="article-wrap">
      <div className="article-top-nav">
        <Link className="back-link" href="/#writing">
          ← 返回文章列表
        </Link>
        <FavoriteButton slug={slug} />
      </div>
      <article className="article">
        <p className="eyebrow">
          {article.category}
          {article.date ? ` · ${article.date}` : ""}
        </p>
        <h1>{article.title}</h1>
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </article>

      {relatedArticles.length > 0 && (
        <section className="related-articles" id="related-articles">
          <p className="eyebrow">Related Articles</p>
          <h2>相关阅读</h2>
          <div className="related-grid">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/writing/${rel.slug}`}
                className="related-card"
              >
                <span>{rel.category}</span>
                <h3>{rel.title}</h3>
                <small>{rel.date}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

