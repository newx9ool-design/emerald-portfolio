'use client';
import { useState } from 'react';
import { useExchangeRate } from '@/app/hooks/useExchangeRate';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';

export default function ExchangePage() {
  const { rate, loading } = useExchangeRate('USD', 'JPY');
  const [amount, setAmount] = useState('1');

  const converted = rate ? (Number(amount) * rate).toFixed(2) : '---';

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-brand-800 mb-6">為替換算</h1>
      <Card>
        <CardTitle>USD → JPY</CardTitle>
        {loading ? (
          <p className="text-brand-400">レート取得中...</p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">現在のレート: 1 USD = ¥{rate?.toFixed(2)}</p>
        )}
        <Input
          label="金額（USD）"
          name="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="例: 100"
        />
        <div className="mt-4 p-4 bg-brand-50 rounded-lg text-center">
          <p className="text-sm text-brand-600">換算結果</p>
          <p className="text-3xl font-bold text-brand-800">¥{Number(converted).toLocaleString()}</p>
        </div>
      </Card>
    </div>
  );
}
