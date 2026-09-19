import fs from "node:fs";
import path from "node:path";

export interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  contentHtml: string;
  description?: string;
}

const articleMeta: Record<string, { title: string; category: string; date: string; lang?: string }> = {
  "behavioral-residual-heat": { title: "行为的残余热量", category: "学习与行动", date: "2026.05" },
  "purposeful-concept-expansion": { title: "没有明确目的的概念扩张", category: "学习与行动", date: "2026.05" },
  "mastery-is-not-ability": { title: "掌握感不是能力", category: "学习与行动", date: "2026.06" },
  "thinking-is-not-action": { title: "思考代替行动", category: "学习与行动", date: "2026.05" },
  "lagrange-duality": { title: "Where the Name ‘Lagrange Duality’ Comes From", category: "技术笔记", date: "2026.03", lang: "en" }
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function markdownToHtml(raw: string): string {
  // Remove frontmatter blocks
  let cleaned = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
  // Remove any secondary divider block
  cleaned = cleaned.replace(/^---\s*\n/, "").trim();

  const lines = cleaned.split(/\r?\n/);
  let html = "";
  let paragraph: string[] = [];
  let listOpen: false | "ul" | "ol" = false;
  let codeOpen = false;
  let mathOpen = false;
  let hasSkippedFirstH1 = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      html += `<p>${inline(paragraph.join(" "))}</p>`;
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listOpen) {
      html += listOpen === "ul" ? "</ul>" : "</ol>";
      listOpen = false;
    }
  };

  for (const line of lines) {
    // Code blocks
    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      html += codeOpen ? "</code></pre>" : "<pre><code>";
      codeOpen = !codeOpen;
      continue;
    }
    if (codeOpen) {
      html += `${escapeHtml(line)}\n`;
      continue;
    }

    // Math blocks $$
    if (line.trim() === "$$") {
      flushParagraph();
      closeList();
      html += mathOpen ? "</code></pre>" : '<pre class="math"><code>';
      mathOpen = !mathOpen;
      continue;
    }
    if (mathOpen) {
      html += `${escapeHtml(line)}\n`;
      continue;
    }

    // Horizontal rules
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph();
      closeList();
      html += "<hr>";
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      // If first line is # Main Title, skip it since the page template already renders <h1>
      if (level === 1 && !hasSkippedFirstH1) {
        hasSkippedFirstH1 = true;
        continue;
      }
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      continue;
    }

    // Unordered lists
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (listOpen !== "ul") {
        closeList();
        html += "<ul>";
        listOpen = "ul";
      }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
      continue;
    }

    // Ordered lists
    const ordered = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (listOpen !== "ol") {
        closeList();
        html += "<ol>";
        listOpen = "ol";
      }
      html += `<li>${inline(ordered[2])}</li>`;
      continue;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      flushParagraph();
      closeList();
      html += `<blockquote><p>${inline(line.slice(2))}</p></blockquote>`;
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return html;
}

function findArticlePath(slug: string): string | null {
  const candidates = [
    path.join(process.cwd(), "content", "writing", `${slug}.md`),
    path.join(process.cwd(), "..", "content", "writing", `${slug}.md`),
    path.join("/content", "writing", `${slug}.md`),
    path.resolve(process.cwd(), "content", "writing", `${slug}.md`),
    path.resolve(process.cwd(), "../content/writing", `${slug}.md`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

export function getArticle(slug: string): Article | null {
  const filePath = findArticlePath(slug);
  const meta = articleMeta[slug];

  if (!filePath && !meta) {
    return null;
  }

  let rawContent = "";
  if (filePath) {
    try {
      rawContent = fs.readFileSync(filePath, "utf8");
    } catch {
      rawContent = "";
    }
  }

  const title = meta?.title || slug.replaceAll("-", " ");
  const category = meta?.category || "思考与笔记";
  const date = meta?.date || "";
  const contentHtml = rawContent ? markdownToHtml(rawContent) : `<p>${meta?.title || ""}</p>`;

  return {
    slug,
    title,
    category,
    date,
    contentHtml
  };
}

export function getAllArticles(): { slug: string; title: string; category: string; date: string }[] {
  return [
    { slug: "behavioral-residual-heat", category: "学习与行动", title: "行为的残余热量", date: "2026.05" },
    { slug: "purposeful-concept-expansion", category: "学习与行动", title: "没有明确目的的概念扩张", date: "2026.05" },
    { slug: "mastery-is-not-ability", category: "学习与行动", title: "掌握感不是能力", date: "2026.06" },
    { slug: "thinking-is-not-action", category: "学习与行动", title: "思考代替行动", date: "2026.05" },
    { slug: "lagrange-duality", category: "技术笔记", title: "Where the Name ‘Lagrange Duality’ Comes From", date: "2026.03" }
  ];
}

export function getRelatedArticles(currentSlug: string, limit = 3): { slug: string; title: string; category: string; date: string }[] {
  const all = getAllArticles();
  const current = all.find((a) => a.slug === currentSlug);
  const currentCategory = current ? current.category : "学习与行动";

  // Articles in the exact same category, excluding current
  const sameCategory = all.filter((a) => a.slug !== currentSlug && a.category === currentCategory);
  if (sameCategory.length >= 2) {
    return sameCategory.slice(0, limit);
  }

  // If fewer than 2-3 in the same category, backfill from other articles
  const otherArticles = all.filter((a) => a.slug !== currentSlug && a.category !== currentCategory);
  return [...sameCategory, ...otherArticles].slice(0, limit);
}

