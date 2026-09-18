import "./styles.css";
import SiteHeader from "@/components/site-header";
import PageTransition from "@/components/page-transition";

export const metadata = { title: "melondy101", description: "黄毅的独立开发与 AI 产品作品集" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
