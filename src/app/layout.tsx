import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Emerald Portfolio',
  description: '個人向け金融資産管理アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="bg-brand-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              💎 Emerald Portfolio
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-brand-200">ダッシュボード</a>
              <a href="/holdings" className="hover:text-brand-200">保有銘柄</a>
              <a href="/search" className="hover:text-brand-200">銘柄検索</a>
              <a href="/exchange" className="hover:text-brand-200">為替</a>
              <a href="/history" className="hover:text-brand-200">資産推移</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
