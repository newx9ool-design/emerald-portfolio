'use client';
import { useState, useEffect } from 'react';

export type SnapshotPoint = {
  date: string;
  valueJPY: number;
};

export function useHistory() {
  const [history, setHistory] = useState<SnapshotPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('取得失敗');
        const json = await res.json();
        // 現時点ではスナップショットが蓄積されるまでダミーデータ
        const today = new Date().toISOString().split('T')[0];
        setHistory([{ date: today, valueJPY: json.totalValueJPY || 0 }]);
      } catch (e) {
        console.error('履歴エラー:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return { history, loading };
}
