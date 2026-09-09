import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "writing");
const outputDir = path.join(root, "dist");

const projects = [
  {
    order: "01",
    name: "拾级 · Gradus",
    en: "Gradus",
    description: "把模糊的学习目标，变成有真实资源支撑、能排进日程的下一步。",
    detail: "从意图识别、资源检索与核验，到 Bloom 认知层级拆解、全局排期和复习节点，Gradus 试图缩短“想学”与“开始学”之间的距离。",
    repo: "https://github.com/melondy101/Gradus",
    live: "https://talk-task.vercel.app/",
    tags: ["Next.js", "AI planning", "Learning systems"]
  },
  {
    order: "02",
    name: "知研 · ZhiHeng",
    en: "ZhiHeng",
    description: "一个不替人下结论的 AI 思辨陪练。",
    detail: "知研把报告、来源状态、观点引导、多轮诘问与成果卡连接成一条可追溯的思考路径；当真实服务不可用时，也要明确展示缓存、fixture 与本地降级。",
    repo: "https://github.com/melondy101/zhiheng",
    live: "https://zhiheng-4yvv7zg1f-2014596548-3040s-projects.vercel.app",
    tags: ["Next.js", "Trustworthy AI", "Thinking tools"]
  }
];

const articleMeta = {
  "behavioral-residual-heat": { title: "行为的残余热量", category: "学习与行动", date: "2026.05" },
  "purposeful-concept-expansion": { title: "没有明确目的的概念扩张", category: "学习与行动", date: "2026.05" },
  "mastery-is-not-ability": { title: "掌握感不是能力", category: "学习与行动", date: "2026.06" },
  "thinking-is-not-action": { title: "思考代替行动", category: "学习与行动", date: "2026.05" },
  "lagrange-duality": { title: "Where the Name ‘Lagrange Duality’ Comes From", category: "技术笔记", date: "2026.03", lang: "en" }
};

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(raw) {
  const cleaned = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
  const lines = cleaned.split(/\r?\n/);
  let html = "";
  let paragraph = [];
  let listOpen = false;
  let codeOpen = false;
  let mathOpen = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      html += `<p>${inline(paragraph.join(" "))}</p>`;
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listOpen) { html += "</ul>"; listOpen = false; }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph(); closeList();
      html += codeOpen ? "</code></pre>" : "<pre><code>";
      codeOpen = !codeOpen;
      continue;
    }
    if (codeOpen) { html += `${escapeHtml(line)}\n`; continue; }
    if (line.trim() === "$$") {
      flushParagraph(); closeList();
      html += mathOpen ? "</code></pre>" : '<pre class="math"><code>';
      mathOpen = !mathOpen;
      continue;
    }
    if (mathOpen) { html += `${escapeHtml(line)}\n`; continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph(); closeList();
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (!listOpen) { html += "<ul>"; listOpen = true; }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph(); closeList();
      html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
      continue;
    }
    if (!line.trim()) { flushParagraph(); closeList(); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph(); closeList();
  return html;
}

function shell({ title, description, body, article = false }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} · melondy101</title>
  <link rel="stylesheet" href="${article ? "../" : ""}styles.css">
</head>
<body>
  <header class="site-header"><a class="wordmark" href="${article ? "../" : "./"}">melondy101</a><nav><a href="${article ? "../#projects" : "#projects"}">Projects</a><a href="${article ? "../#writing" : "#writing"}">Writing</a><a href="${article ? "../#about" : "#about"}">About</a></nav></header>
  ${body}
  <footer><span>黄毅 · melondy101</span><a href="https://github.com/melondy101">GitHub</a></footer>
</body>
</html>`;
}

function projectCard(project) {
  return `<article class="project-card project-${project.order}"><div class="project-order">/${project.order}</div><div><p class="eyebrow">${project.en}</p><h3>${project.name}</h3><p class="project-description">${project.description}</p><p>${project.detail}</p><div class="tags">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div><p class="links"><a href="${project.repo}" target="_blank" rel="noreferrer">源码 ↗</a><a href="${project.live}" target="_blank" rel="noreferrer">打开作品 ↗</a></p></div></article>`;
}

async function build() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(path.join(outputDir, "writing"), { recursive: true });
  const files = (await readdir(contentDir)).filter((file) => file.endsWith(".md")).sort();
  const articles = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const meta = articleMeta[slug] ?? { title: slug.replaceAll("-", " "), category: "Writing", date: "" };
    const source = await readFile(path.join(contentDir, file), "utf8");
    const html = markdownToHtml(source);
    articles.push({ slug, ...meta });
    const articleBody = `<main class="article-wrap"><a class="back-link" href="../#writing">← Writing</a><article class="article"><p class="eyebrow">${meta.category}${meta.date ? ` · ${meta.date}` : ""}</p><h1>${meta.title}</h1><div class="article-content">${html}</div></article></main>`;
    await writeFile(path.join(outputDir, "writing", `${slug}.html`), shell({ title: meta.title, description: meta.title, body: articleBody, article: true }));
  }

  const articleCards = articles.map((article) => `<a class="article-card" href="writing/${article.slug}.html"><span>${article.category}</span><h3>${article.title}</h3><small>${article.date}</small></a>`).join("");
  const home = `<main>
    <section class="intro"><div class="intro-copyblock"><p class="eyebrow">黄毅 / Independent developer</p><h1>一些还在<br>变成现实的想法。</h1><p class="intro-copy">我把学习、思考与行动里容易断掉的那一步，做成能亲手体验的 AI 系统。</p></div><div class="desk" aria-label="探索者工作台"><a class="desk-note note-build" href="#projects"><small>正在构建</small><strong>把模糊意图<br>变成下一步</strong><span>打开作品 ↓</span></a><a class="desk-note note-think" href="#writing"><small>最近在想</small><strong>掌握感<br>不是能力</strong><span>阅读文章 ↗</span></a><a class="desk-note note-gradus" href="https://talk-task.vercel.app/" target="_blank" rel="noreferrer"><small>作品 / 01</small><strong>Gradus</strong><span>在线体验 ↗</span></a><a class="desk-note note-zhiheng" href="https://zhiheng-4yvv7zg1f-2014596548-3040s-projects.vercel.app" target="_blank" rel="noreferrer"><small>作品 / 02</small><strong>ZhiHeng</strong><span>在线体验 ↗</span></a></div></section>
    <section id="projects" class="section"><p class="eyebrow">Selected work</p><h2>作品</h2><div class="projects">${projects.map(projectCard).join("")}</div></section>
    <section id="writing" class="section writing"><p class="eyebrow">Writing</p><h2>思考与笔记</h2><p class="section-copy">关于学习如何发生、行动如何延续，以及我在技术学习中留下的解释。</p><div class="article-grid">${articleCards}</div></section>
    <section id="about" class="about"><p class="eyebrow">About</p><h2>我如何做事</h2><p>先把问题做成能走通的 Demo；让 AI 提供结构、生成与检索，但不掩饰它的来源与失败；把关键选择留给使用工具的人。</p><p>我参与过 Datawhale、Watcha 等学习社区的助教与学习活动，也持续在开源与 AI 系统中学习。</p></section>
  </main>`;
  await writeFile(path.join(outputDir, "index.html"), shell({ title: "黄毅 / melondy101", description: "黄毅的独立开发与 AI 产品作品集", body: home }));
  await cp(path.join(root, "styles.css"), path.join(outputDir, "styles.css"));
}

build().catch((error) => { console.error(error); process.exitCode = 1; });
