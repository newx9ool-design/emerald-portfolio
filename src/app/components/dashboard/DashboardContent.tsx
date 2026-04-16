'use client';

import { useState } from 'react';
import { useDashboard } from '@/app/hooks/useDashboard';
import { useHistory } from '@/app/hooks/useHistory';
import { useExchangeRate } from '@/app/hooks/useExchangeRate';
import { Card, CardTitle, CardValue } from '@/app/components/ui/Card';
import { DonutChart } from '@/app/components/charts/DonutChart';
import { HistoryChart } from '@/app/components/charts/HistoryChart';
import { Loading } from '@/app/components/ui/Loading';
import { Button } from '@/app/components/ui/Button';

type MarketIndicator = {
  key: string;
  label: string;
  value: number | null;
  change_pct?: number;
  change?: number;
  currency?: string;
  source?: string;
  error?: string;
};

export default function DashboardContent() {
  const { data, loading: dashLoading, refetch: refetchDash } = useDashboard();
  const { history, loading: histLoading, refetch: refetchHist } = useHistory();
  const { rate, loading: rateLoading } = useExchangeRate();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [indicators, setIndicators] = useState<MarketIndicator[]>([]);
  const [marketUpdatedAt, setMarketUpdatedAt] = useState('');

  if (dashLoading || histLoading || rateLoading) {
    return <Loading />;
  }

  const categoriesObj = data?.categories || {};
  const totalValueJPY = data?.totalValueJPY || 0;
  const holdingsCount = data?.holdingsCount || 0;

  const categories = Object.entries(categoriesObj).map(([code, cat]: [string, any]) => ({
    code,
    name_ja: cat.name,
    totalValueJPY: cat.totalJPY,
    count: cat.count,
  }));

  const chartData = categories.map((c) => ({
    name: c.name_ja,
    value: c.totalValueJPY,
    code: c.code,
  }));

  const formatJPY = (value: number) => {
    return '\u00A5' + Math.round(value).toLocaleString('ja-JP');
  };

  const formatPct = (value: number) => {
    if (totalValueJPY === 0) return '0.0%';
    return ((value / totalValueJPY) * 100).toFixed(1) + '%';
  };

  const formatChange = (change: number | undefined, currency: string | undefined) => {
    if (change === undefined || change === null) return '';
    const sign = change >= 0 ? '+' : '';
    if (currency === 'JPY') {
      return sign + '\u00A5' + Math.round(change).toLocaleString('ja-JP');
    }
    return sign + change.toFixed(2);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage('');
    try {
      const [snapshotRes, marketRes] = await Promise.all([
        fetch('/api/snapshot', { method: 'POST' }),
        fetch('/api/market'),
      ]);

      if (snapshotRes.ok) {
        const snapJson = await snapshotRes.json();
        setMessage('Updated: ' + formatJPY(snapJson.totalValueJPY));
        if (refetchDash) await refetchDash();
        if (refetchHist) await refetchHist();
      }

      if (marketRes.ok) {
        const marketJson = await marketRes.json();
        setIndicators(marketJson.indicators || []);
        setMarketUpdatedAt(marketJson.updatedAt || '');
      }
    } catch (e) {
      setMessage('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={handleUpdate} disabled={updating}>
          {updating ? 'Updating...' : 'Update Prices'}
        </Button>
      </div>

      {message && (
        <div className="bg-brand-100 text-brand-800 px-4 py-2 rounded text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardTitle>Total Assets</CardTitle>
          <CardValue>{formatJPY(totalValueJPY)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Holdings</CardTitle>
          <CardValue>{holdingsCount}</CardValue>
        </Card>
        <Card>
          <CardTitle>USD/JPY</CardTitle>
          <CardValue>{rate ? '\u00A5' + rate.toFixed(2) : '-'}</CardValue>
        </Card>
      </div>

      {indicators.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Market Index</CardTitle>
            {marketUpdatedAt && (
              <span className="text-xs text-gray-400">
                {new Date(marketUpdatedAt).toLocaleString('ja-JP')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {indicators.map((ind) => (
              <div key={ind.key} className="bg-brand-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{ind.label}</p>
                {ind.value !== null ? (
                  <>
                    <p className="text-lg font-bold text-brand-800">
                      {ind.currency === 'JPY'
                        ? '\u00A5' + Math.round(ind.value).toLocaleString('ja-JP')
                        : '$' + ind.value.toLocaleString()}
                    </p>
                    {ind.change !== undefined && ind.change !== null && (
                      <p className={`text-xs mt-1 ${ind.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatChange(ind.change, ind.currency)}
                        {ind.change_pct !== undefined && ind.change_pct !== null
                          ? ' (' + (ind.change_pct >= 0 ? '+' : '') + ind.change_pct.toFixed(2) + '%)'
                          : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">-</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Asset Allocation</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <DonutChart data={chartData} />
          </div>
          <div className="space-y-3">
            {categories
              .filter((c) => c.totalValueJPY > 0)
              .sort((a, b) => b.totalValueJPY - a.totalValueJPY)
              .map((c) => (
                <div key={c.code} className="flex items-center justify-between py-2 border-b border-brand-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-700">{c.name_ja}</span>
                    <span className="text-xs text-gray-400">({c.count})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-brand-800">
                      {formatJPY(c.totalValueJPY)}
                    </span>
                    <span className="text-sm text-brand-600 ml-2">
                      ({formatPct(c.totalValueJPY)})
                    </span>
                  </div>
                </div>
              ))}
            <div className="flex items-center justify-between pt-3 border-t-2 border-brand-300">
              <span className="text-sm font-bold text-brand-800">Total</span>
              <div className="text-right">
                <span className="text-sm font-bold text-brand-800">
                  {formatJPY(totalValueJPY)}
                </span>
                <span className="text-sm text-brand-600 ml-2">(100%)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Asset History</CardTitle>
        <HistoryChart data={history} />
      </Card>
    </div>
  );
}
