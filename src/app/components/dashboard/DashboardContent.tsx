'use client';
import { useDashboard } from '@/app/hooks/useDashboard';
import { useHistory } from '@/app/hooks/useHistory';
import { useExchangeRate } from '@/app/hooks/useExchangeRate';
import { Card, CardTitle, CardValue } from '@/app/components/ui/Card';
import { DonutChart } from '@/app/components/charts/DonutChart';
import { HistoryChart } from '@/app/components/charts/HistoryChart';
import { Loading } from '@/app/components/ui/Loading';

export function DashboardContent() {
  const { data, loading } = useDashboard();
  const { history, loading: histLoading } = useHistory();
  const { rate } = useExchangeRate();

  if (loading) return <Loading message="ダッシュボードを読み込み中..." />;

  const categories = data?.categories || {};
  const donutData = Object.values(categories).map((c) => ({ name: c.name, value: c.totalJPY }));

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardTitle>総資産額</CardTitle>
          <CardValue>¥{(data?.totalValueJPY || 0).toLocaleString()}</CardValue>
        </Card>
        <Card>
          <CardTitle>保有銘柄数</CardTitle>
          <CardValue>{data?.holdingsCount || 0} 銘柄</CardValue>
        </Card>
        <Card>
          <CardTitle>USD/JPY</CardTitle>
          <CardValue>{rate ? `¥${rate.toFixed(2)}` : '---'}</CardValue>
        </Card>
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardTitle>資産配分</CardTitle>
          <DonutChart data={donutData} />
        </Card>
        <Card>
          <CardTitle>資産推移</CardTitle>
          {histLoading ? <Loading /> : <HistoryChart data={history} />}
        </Card>
      </div>
    </div>
  );
}
