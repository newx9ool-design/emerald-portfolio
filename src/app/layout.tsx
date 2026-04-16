import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Emerald Portfolio',
  description: 'Personal Asset Management App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="bg-brand-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              Emerald Portfolio
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-brand-200">Dashboard</a>
              <a href="/holdings" className="hover:text-brand-200">Holdings</a>
              <a href="/history" className="hover:text-brand-200">History</a>
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
