import { NextRequest, NextResponse } from 'next/server';
import { getStockPrice } from '@/app/lib/market/yahoo';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'シンボルを指定してください' }, { status: 400 });
  }

  try {
    const price = await getStockPrice(symbol);
    if (!price) {
      return NextResponse.json({ error: '価格を取得できませんでした' }, { status: 404 });
    }
    return NextResponse.json(price);
  } catch (e) {
    return NextResponse.json({ error: '価格取得に失敗しました' }, { status: 500 });
  }
}
