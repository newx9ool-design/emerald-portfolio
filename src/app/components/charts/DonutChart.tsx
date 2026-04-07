'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type ChartData = {
  name: string;
  value: number;
  code?: string;
};

type Props = {
  data: ChartData[];
};

const CATEGORY_COLORS: Record<string, string> = {
  DOMESTIC_STOCK: '#10B981',
  US_STOCK:       '#6EE7B7',
  MUTUAL_FUND:    '#67E8F9',
  CRYPTO:         '#FDE68A',
  BOND:           '#A78BFA',
  CASH:           '#FBCFE8',
};

const FALLBACK_COLORS = ['#10B981', '#6EE7B7', '#67E8F9', '#FDE68A', '#A78BFA', '#FBCFE8'];

function getColor(entry: ChartData, index: number): string {
  if (entry.code && CATEGORY_COLORS[entry.code]) {
    return CATEGORY_COLORS[entry.code];
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const formatTooltipValue = (value: number | string | Array<number | string>): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return '\u00A5' + Math.round(num).toLocaleString();
};

export function DonutChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data available
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
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [formatTooltipValue(value as number), 'Amount']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
