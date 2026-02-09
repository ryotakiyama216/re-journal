import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Re:Journal | 辞めていい、戻っていいジャーナル",
  description: "3日坊主のための、AIが寄り添うジャーナリングアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
