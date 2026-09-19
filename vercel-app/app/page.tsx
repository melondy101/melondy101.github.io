import Link from "next/link";
import projects from "../../content/projects.json";

const articles = [
  ["behavioral-residual-heat", "学习与行动", "行为的残余热量", "2026.05"],
  ["purposeful-concept-expansion", "学习与行动", "没有明确目的的概念扩张", "2026.05"],
  ["mastery-is-not-ability", "学习与行动", "掌握感不是能力", "2026.06"],
  ["thinking-is-not-action", "学习与行动", "思考代替行动", "2026.05"],
  ["lagrange-duality", "技术笔记", "Where the Name ‘Lagrange Duality’ Comes From", "2026.03"]
];

export default function HomePage() {
  return (
    <main>
      <section className="intro">
        <div className="intro-copyblock">
          <p className="eyebrow">黄毅 / Independent developer</p>
          <h1>一些还在<br />变成现实的想法。</h1>
          <p className="intro-copy">我把学习、思考与行动里容易断掉的那一步，做成能亲手体验的 AI 系统。</p>
        </div>
        <div className="desk" aria-label="探索者工作台">
          <a className="desk-note note-build" href="#projects">
            <small>正在构建</small>
            <strong>把模糊意图<br />变成下一步</strong>
            <span>打开作品 ↓</span>
          </a>
          <a className="desk-note note-think" href="#writing">
            <small>最近在想</small>
            <strong>掌握感<br />不是能力</strong>
            <span>阅读文章 ↗</span>
          </a>
          {projects.map((project) => (
            <a key={project.order} className={`desk-note note-${project.en.toLowerCase()}`} href={project.live} target="_blank" rel="noreferrer">
              <small>作品 / {project.order}</small>
              <strong>{project.en}</strong>
              <span>在线体验 ↗</span>
            </a>
          ))}
        </div>
      </section>

      <section id="projects" className="section">
        <p className="eyebrow">Selected work</p>
        <h2>作品</h2>
        <div className="projects">
          {projects.map((project) => (
            <article key={project.order} className={`project-card ${project.order === "02" ? "project-02" : ""}`}>
              <div className="project-order">/{project.order}</div>
              <div>
                <p className="eyebrow">{project.en}</p>
                <h3>{project.name}</h3>
                <p className="project-description">{project.description}</p>
                <p>{project.detail}</p>
                <div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <p className="links">
                  <a href={project.repo}>源码 ↗</a>
                  <a href={project.live}>打开作品 ↗</a>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="writing" className="section writing">
        <p className="eyebrow">Writing</p>
        <h2>思考与笔记</h2>
        <p className="section-copy">关于学习如何发生、行动如何延续，以及我在技术学习中留下的解释。</p>
        <div className="article-grid">
          {articles.map(([slug, category, title, date]) => (
            <Link className="article-card" href={`/writing/${slug}`} key={slug}>
              <span>{category}</span>
              <h3>{title}</h3>
              <small>{date}</small>
            </Link>
          ))}
        </div>
      </section>

      <section id="about" className="about">
        <p className="eyebrow">About</p>
        <h2>我如何做事</h2>
        <p>先把问题做成能走通的 Demo；让 AI 提供结构、生成与检索，但不掩饰它的来源与失败；把关键选择留给使用工具的人。</p>
        <p>我参与过 Datawhale、Watcha 等学习社区的助教与学习活动，也持续在开源与 AI 系统中学习。</p>

        <div className="about-contact-row">
          <span className="contact-label">联系我 / Contact:</span>
          <a className="contact-link" href="mailto:dae201459@gmail.com">
            dae201459@gmail.com ↗
          </a>
          <span className="contact-sep">/</span>
          <a className="contact-link" href="https://github.com/melondy101" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
      </section>
    </main>
  );
}

