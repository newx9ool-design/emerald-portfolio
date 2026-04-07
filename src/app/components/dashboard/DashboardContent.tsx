'use client';

import { useDashboard } from '@/app/hooks/useDashboard';
import { useHistory } from '@/app/hooks/useHistory';
import { useExchangeRate } from '@/app/hooks/useExchangeRate';
import { Card, CardTitle, CardValue } from '@/app/components/ui/Card';
import { DonutChart } from '@/app/components/charts/DonutChart';
import { HistoryChart } from '@/app/components/charts/HistoryChart';
import { Loading } from '@/app/components/ui/Loading';

export default function DashboardContent() {
  const { data, loading: dashLoading } = useDashboard();
  const { history, loading: histLoading } = useHistory();
  const { rate, loading: rateLoading } = useExchangeRate();

  if (dashLoading || histLoading || rateLoading) {
    return <Loading />;
  }

  const categoriesObj = data?.categories || {};
  const totalValueJPY = data?.totalValueJPY || 0;
  const holdingsCount = data?.holdingsCount || 0;

  // Convert Record to array
  const categories = Object.entries(categoriesObj).map(([code, cat]) => ({
    code,
    name_ja: cat.name,
    totalValueJPY: cat.totalJPY,
    count: cat.count,
  }));

  const chartData = categories.map((c) => ({
    name: c.name_ja,
    value: c.totalValueJPY,
  }));

  const formatJPY = (value: number) => {
    return `¥${Math.round(value).toLocaleString('ja-JP')}`;
  };

  const formatPct = (value: number) => {
    if (totalValueJPY === 0) return '0.0%';
    return `${((value / totalValueJPY) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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
          <CardValue>{rate ? `¥${rate.toFixed(2)}` : '-'}</CardValue>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardTitle>Asset Allocation</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Donut Chart */}
          <div>
            <DonutChart data={chartData} />
          </div>

          {/* Category List with % */}
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
            {/* Total Row */}
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

      {/* History Chart */}
      <Card>
        <CardTitle>Asset History</CardTitle>
        <HistoryChart data={history} />
      </Card>
    </div>
  );
}
