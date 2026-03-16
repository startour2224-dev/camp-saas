import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Camp Reception",
  description: "キャンプ場受付SaaSプロトタイプ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}