'use client';
import { useState, useEffect, useCallback } from 'react';

export type DashboardData = {
  totalValueJPY: number;
  totalCostJPY?: number;
  holdingsCount: number;
  categories: Record<string, { name: string; totalJPY: number; costJPY?: number; count: number }>;
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, refetch: fetchDashboard };
}
