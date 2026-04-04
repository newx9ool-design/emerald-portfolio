'use client';
import { useState, useEffect } from 'react';

export type DashboardData = {
  totalValueJPY: number;
  holdingsCount: number;
  categories: Record<string, { name: string; totalJPY: number; count: number }>;
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('取得失敗');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('ダッシュボードエラー:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return { data, loading };
}
