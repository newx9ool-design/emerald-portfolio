export function formatJPY(value: number): string {
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function formatUSD(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function isUSDAsset(currency: string): boolean {
  return currency === 'USD';
}
