import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRate } from '@/app/lib/market/frankfurter';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') || 'USD';
  const to = request.nextUrl.searchParams.get('to') || 'JPY';

  try {
    const rate = await getExchangeRate(from, to);
    return NextResponse.json({ from, to, rate, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('為替取得エラー:', error);
    return NextResponse.json({ error: '為替レートの取得に失敗しました' }, { status: 500 });
  }
}
