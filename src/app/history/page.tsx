'use client';
import { useState } from 'react';
import { useHistory } from '@/app/hooks/useHistory';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { HistoryChart } from '@/app/components/charts/HistoryChart';
import { Button } from '@/app/components/ui/Button';
import { Loading } from '@/app/components/ui/Loading';

export default function HistoryPage() {
  const { history, loading, saveSnapshot } = useHistory();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage('');
    try {
      const result = await saveSnapshot();
      setMessage(
        `Snapshot saved: ${result.date} - Total: Y${Number(result.totalValueJPY).toLocaleString()} (USD/JPY: ${result.usdJpy})`
      );
      setTimeout(() => setMessage(''), 10000);
    } catch (e) {
      setMessage('Failed to save snapshot');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-800">Portfolio History</h1>
        <Button onClick={handleUpdate} disabled={updating}>
          {updating ? 'Updating...' : 'Update Today'}
        </Button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-brand-100 text-brand-800 rounded-lg text-sm font-medium">
          {message}
        </div>
      )}

      <Card>
        <CardTitle>Asset History (Daily Snapshot)</CardTitle>
        {loading ? <Loading /> : <HistoryChart data={history} />}
        {!loading && history.length === 0 && (
          <p className="text-sm text-gray-400 mt-4 text-center">
            No snapshots yet. Click &quot;Update Today&quot; to save your first snapshot.
          </p>
        )}
        {!loading && history.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-2">Recent snapshots:</p>
            <div className="space-y-1">
              {history.slice(-7).reverse().map((s) => (
                <div key={s.date} className="flex justify-between text-sm">
                  <span className="text-gray-600">{s.date}</span>
                  <span className="font-medium text-brand-700">
                    Y{Math.round(s.valueJPY).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
