'use client';
import { useState } from 'react';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

type SearchResult = { symbol: string; name: string; type: string; exchange: string };

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setError('');
    setResults([]); // 前回の結果をクリア
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
        setError('予期しないレスポンス形式です');
      }
    } catch (err) {
      console.error('検索エラー:', err);
      setError('検索に失敗しました。もう一度お試しください。');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800 mb-6">銘柄検索</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="企業名またはシンボルを入力（例: トヨタ, AAPL, bitcoin）"
          className="flex-1 border border-brand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <Button type="submit" disabled={loading}>
          {loading ? '検索中...' : '検索'}
        </Button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="space-y-2">
        {results.map((r, i) => (
          <Card key={`${r.symbol}-${i}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-brand-800">{r.name}</p>
                <p className="text-sm text-gray-500">{r.symbol} · {r.exchange}</p>
              </div>
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">
                {r.type}
              </span>
            </div>
          </Card>
        ))}
        {searched && !loading && results.length === 0 && !error && (
          <p className="text-center text-brand-400 py-4">結果が見つかりません</p>
        )}
      </div>
    </div>
  );
}
