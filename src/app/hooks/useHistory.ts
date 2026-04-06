'use client';
import { useState, useEffect, useCallback } from 'react';

export type SnapshotPoint = {
  date: string;
  valueJPY: number;
};

export function useHistory() {
  const [history, setHistory] = useState<SnapshotPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snapshot');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const saveSnapshot = async () => {
    const res = await fetch('/api/snapshot', { method: 'POST' });
    if (!res.ok) throw new Error('Snapshot save failed');
    const result = await res.json();
    await fetchHistory();
    return result;
  };

  return { history, loading, saveSnapshot, refetch: fetchHistory };
}
