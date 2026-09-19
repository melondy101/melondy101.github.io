"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <main style={{ padding: "40px", textAlign: "center" }}>
          <h2>出错了</h2>
          <button onClick={() => reset()} style={{ marginTop: "16px", padding: "8px 16px" }}>重试</button>
        </main>
      </body>
    </html>
  );
}
