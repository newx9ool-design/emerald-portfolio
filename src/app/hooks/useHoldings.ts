'use client';
import { useState, useEffect, useCallback } from 'react';

export function useHoldings() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/holdings');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setHoldings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const addHolding = async (body: any) => {
    const res = await fetch('/api/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Add failed');
    await fetchHoldings();
    return res.json();
  };

  const deleteHolding = async (id: string, quantity?: number) => {
    const res = await fetch('/api/holdings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity }),
    });
    if (!res.ok) throw new Error('Delete failed');
    await fetchHoldings();
  };

  const editHolding = async (data: {
    id: string;
    name_ja?: string;
    quantity?: number;
    avg_purchase_price?: number;
    purchase_currency?: string;
    memo?: string;
  }) => {
    const res = await fetch('/api/holdings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Update failed');
    await fetchHoldings();
  };

  return { holdings, loading, error, addHolding, deleteHolding, editHolding, refetch: fetchHoldings };
}
