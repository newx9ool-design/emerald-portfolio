'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type HistoryData = {
  date: string;
  valueJPY: number;
};

type Props = {
  data: HistoryData[];
};

const formatYAxis = (value: number): string => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }
  return `¥${value.toLocaleString()}`;
};

const formatTooltipValue = (value: number | string | Array<number | string>): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return `¥${Math.round(num).toLocaleString()}`;
};

export function HistoryChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip formatter={(value) => [formatTooltipValue(value as number), '資産額']} />
        <Area
          type="monotone"
          dataKey="valueJPY"
          stroke="var(--color-brand-500)"
          fill="url(#colorValue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
