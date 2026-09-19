import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

export default function WritingPage() {
  const articles = getAllArticles();

  return (
    <main className="shell">
      <div className="article-top-nav" style={{ marginBottom: "20px" }}>
        <Link className="back-link" href="/">
          ← 返回首页
        </Link>
      </div>
      <p className="eyebrow">Writing</p>
      <h1>思考与笔记</h1>
      <p className="section-copy" style={{ margin: "0 0 32px", color: "#6b7366" }}>
        关于学习如何发生、行动如何延续，以及我在技术学习中留下的解释。
      </p>
      <div className="article-grid">
        {articles.map((article) => (
          <Link className="article-card" href={`/writing/${article.slug}`} key={article.slug}>
            <span>{article.category}</span>
            <h3>{article.title}</h3>
            <small>{article.date}</small>
          </Link>
        ))}
      </div>
    </main>
  );
}

