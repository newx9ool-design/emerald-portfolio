'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

type Indicator = {
  label: string;
  value: number | null;
  change_pct?: number;
  currency?: string;
  symbol?: string;
  source?: string;
  error?: string;
};

type MarketData = {
  indicators: Record<string, Indicator>;
  updatedAt: string;
};

export default function MarketIndexPage() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/market');
      if (!res.ok) throw new Error('Failed to fetch market data');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number, currency?: string) => {
    if (currency === '$') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (value >= 1000000) {
      return `¥${value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
    }
    return `¥${value.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChangePct = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return null;
    const sign = pct >= 0 ? '+' : '';
    const color = pct >= 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`text-sm font-medium ${color}`}>
        {sign}{pct.toFixed(2)}%
      </span>
    );
  };

  const indicatorConfig = [
    { key: 'usdjpy', icon: '💱', description: 'US Dollar / Japanese Yen' },
    { key: 'nikkei', icon: '🇯🇵', description: 'Tokyo Stock Exchange Index' },
    { key: 'dow', icon: '🇺🇸', description: 'New York Stock Exchange Index' },
    { key: 'btcjpy', icon: '₿', description: 'Bitcoin / Japanese Yen' },
    { key: 'allcountry', icon: '🌍', description: 'Global Equity Index Fund' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-800">Market Index</h1>
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {!data && !loading && (
        <Card>
          <p className="text-gray-500 text-center py-8">
            Click "Update" to fetch the latest market data.
          </p>
        </Card>
      )}

      {loading && (
        <Card>
          <p className="text-brand-600 text-center py-8 animate-pulse">
            Fetching market data...
          </p>
        </Card>
      )}

      {data && !loading && (
        <>
          <div className="space-y-4">
            {indicatorConfig.map(({ key, icon, description }) => {
              const ind = data.indicators[key];
              if (!ind) return null;

              return (
                <Card key={key}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{icon}</span>
                        <CardTitle>{ind.label}</CardTitle>
                      </div>
                      <p className="text-xs text-gray-400 ml-8">{description}</p>
                      {ind.symbol && (
                        <p className="text-xs text-gray-400 ml-8">{ind.symbol}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {ind.value !== null ? (
                        <>
                          <p className="text-2xl font-bold text-brand-800">
                            {formatNumber(ind.value, ind.currency)}
                          </p>
                          {ind.change_pct !== undefined && ind.change_pct !== 0 && (
                            <p>{formatChangePct(ind.change_pct)}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          {ind.error || 'No data'}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 text-right mt-4">
            Updated: {new Date(data.updatedAt).toLocaleString('ja-JP')}
          </p>
        </>
      )}
    </div>
  );
}
