import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "부동산 인사이트",
  description: "검색, 랭킹, 핫스팟, 정책 뉴스까지 한 곳에서.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="container-page py-4">
          {children}
        </div>
      </body>
    </html>
  );
}
