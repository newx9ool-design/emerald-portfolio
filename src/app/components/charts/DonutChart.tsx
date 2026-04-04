'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type ChartData = {
  name: string;
  value: number;
};

type Props = {
  data: ChartData[];
};

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
];

const formatTooltipValue = (value: number | string | Array<number | string>): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return `¥${Math.round(num).toLocaleString()}`;
};

export function DonutChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [formatTooltipValue(value as number), '金額']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
