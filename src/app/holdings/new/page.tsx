'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

type Category = { id: string; code: string; name_ja: string };

export default function NewHoldingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: '',
    name_ja: '',
    quantity: '',
    avg_purchase_price: '',
    purchase_currency: 'JPY',
    memo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('asset_categories')
        .select('id, code, name_ja')
        .order('code');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateSymbol = (name: string, categoryCode: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const prefix = categoryCode || 'OTH';
    const nameSlug = name.slice(0, 4).toUpperCase();
    return `${prefix}-${nameSlug}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const selectedCategory = categories.find(c => c.id === form.category_id);
      const categoryCode = selectedCategory?.code || 'OTHER';
      const symbol = generateSymbol(form.name_ja, categoryCode);

      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: form.category_id,
          symbol,
          name_ja: form.name_ja,
          quantity: Number(form.quantity),
          avg_purchase_price: Number(form.avg_purchase_price),
          purchase_currency: form.purchase_currency,
          memo: form.memo,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '登録に失敗しました');
      }
      router.push('/holdings');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: '', label: '選択してください' },
    ...categories.map(c => ({ value: c.id, label: c.name_ja })),
  ];

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-brand-800 mb-6">銘柄を登録</h1>
      <Card>
        <CardTitle>銘柄情報</CardTitle>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <Input
            label="カテゴリ"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
            options={categoryOptions}
          />
          <Input
            label="銘柄名"
            name="name_ja"
            value={form.name_ja}
            onChange={handleChange}
            required
            placeholder="例: トヨタ自動車、Apple Inc.、ビットコイン"
          />
          <Input
            label="数量"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            required
            placeholder="例: 100"
          />
          <Input
            label="平均取得単価"
            name="avg_purchase_price"
            type="number"
            value={form.avg_purchase_price}
            onChange={handleChange}
            required
            placeholder="例: 2500"
          />
          <Input
            label="通貨"
            name="purchase_currency"
            value={form.purchase_currency}
            onChange={handleChange}
            options={[
              { value: 'JPY', label: '円 (JPY)' },
              { value: 'USD', label: 'ドル (USD)' },
            ]}
          />
          <Input
            label="メモ"
            name="memo"
            value={form.memo}
            onChange={handleChange}
            placeholder="任意のメモ"
          />
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={submitting}>
              {submitting ? '登録中...' : '登録する'}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/holdings')}
              className="px-4 py-2 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
