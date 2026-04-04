'use client';
import { useState, useEffect } from 'react';

export function useExchangeRate(from = 'USD', to = 'JPY') {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch(`/api/exchange?from=${from}&to=${to}`);
        if (!res.ok) throw new Error('取得失敗');
        const json = await res.json();
        setRate(json.rate);
      } catch (e) {
        console.error('為替エラー:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRate();
  }, [from, to]);

  return { rate, loading };
}
