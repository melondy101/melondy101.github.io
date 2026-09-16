import Link from "next/link";

const articles = [
  ["behavioral-residual-heat", "行为的残余热量"],
  ["purposeful-concept-expansion", "没有明确目的的概念扩张"],
  ["mastery-is-not-ability", "掌握感不是能力"],
  ["thinking-is-not-action", "思考代替行动"],
  ["lagrange-duality", "Where the Name ‘Lagrange Duality’ Comes From"]
];

export default function WritingPage() {
  return <main className="shell"><p className="eyebrow">Writing</p><h1>思考与笔记</h1><ul>{articles.map(([slug, title]) => <li key={slug}><Link href={`/writing/${slug}`}>{title}</Link></li>)}</ul></main>;
}
