type Props = {
  children: React.ReactNode;
  code?: string;
  type?: string;
};

const colorMap: Record<string, string> = {
  DOMESTIC_STOCK: 'bg-brand-100 text-brand-800',
  US_STOCK: 'bg-blue-100 text-blue-800',
  MUTUAL_FUND: 'bg-purple-100 text-purple-800',
  CRYPTO: 'bg-yellow-100 text-yellow-800',
  BOND: 'bg-orange-100 text-orange-800',
  CASH: 'bg-green-100 text-green-800',
  profit: 'bg-green-100 text-green-700',
  loss: 'bg-red-100 text-red-700',
};

export function Badge({ children, code, type }: Props) {
  const key = code || type || '';
  const colors = colorMap[key] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors}`}>
      {children}
    </span>
  );
}
