'use client';
import { useHistory } from '@/app/hooks/useHistory';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { HistoryChart } from '@/app/components/charts/HistoryChart';
import { Loading } from '@/app/components/ui/Loading';

export default function HistoryPage() {
  const { history, loading } = useHistory();

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800 mb-6">資産推移</h1>
      <Card>
        <CardTitle>過去の資産推移（日次スナップショット）</CardTitle>
        {loading ? <Loading /> : <HistoryChart data={history} />}
        <p className="text-xs text-gray-400 mt-4 text-center">
          ※ 毎日自動で記録されます。データが蓄積されるとグラフが表示されます。
        </p>
      </Card>
    </div>
  );
}
