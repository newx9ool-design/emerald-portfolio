import { NextResponse } from 'next/server';
import { getExchangeRate } from '@/app/lib/market/frankfurter';
import { getStockPrice } from '@/app/lib/market/yahoo';

export async function GET() {
  try {
    const indicators: any[] = [];

    // 1. USD/JPY
    try {
      const rate = await getExchangeRate('USD', 'JPY');
      const usdjpyQuote = await getStockPrice('JPY=X');
      indicators.push({
        key: 'usdjpy',
        label: 'USD/JPY',
        value: rate || usdjpyQuote?.price || null,
        change: usdjpyQuote?.change || null,
        change_pct: usdjpyQuote?.change_pct || null,
        currency: 'JPY',
      });
    } catch (e) {
      console.error('USD/JPY error:', e);
      indicators.push({ key: 'usdjpy', label: 'USD/JPY', value: null, error: 'Failed' });
    }

    // 2. Nikkei 225
    try {
      const q = await getStockPrice('^N225');
      indicators.push({
        key: 'nikkei',
        label: 'Nikkei 225',
        value: q?.price || null,
        change: q?.change || null,
        change_pct: q?.change_pct || 0,
        currency: 'JPY',
      });
    } catch (e) {
      console.error('Nikkei error:', e);
      indicators.push({ key: 'nikkei', label: 'Nikkei 225', value: null, error: 'Failed' });
    }

    // 3. S&P 500
    try {
      const q = await getStockPrice('^GSPC');
      indicators.push({
        key: 'sp500',
        label: 'S&P 500',
        value: q?.price || null,
        change: q?.change || null,
        change_pct: q?.change_pct || 0,
        currency: 'USD',
      });
    } catch (e) {
      console.error('S&P 500 error:', e);
      indicators.push({ key: 'sp500', label: 'S&P 500', value: null, error: 'Failed' });
    }

    // 4. NASDAQ
    try {
      const q = await getStockPrice('^IXIC');
      indicators.push({
        key: 'nasdaq',
        label: 'NASDAQ',
        value: q?.price || null,
        change: q?.change || null,
        change_pct: q?.change_pct || 0,
        currency: 'USD',
      });
    } catch (e) {
      console.error('NASDAQ error:', e);
      indicators.push({ key: 'nasdaq', label: 'NASDAQ', value: null, error: 'Failed' });
    }

    // 5. Gold (1540.T)
    try {
      const q = await getStockPrice('1540.T');
      indicators.push({
        key: 'gold',
        label: 'Gold (1540)',
        value: q?.price || null,
        change: q?.change || null,
        change_pct: q?.change_pct || 0,
        currency: 'JPY',
      });
    } catch (e) {
      console.error('Gold error:', e);
      indicators.push({ key: 'gold', label: 'Gold/JPY', value: null, error: 'Failed' });
    }

    // 6. BTC/JPY
    try {
      const q = await getStockPrice('BTC-JPY');
      indicators.push({
        key: 'btcjpy',
        label: 'BTC/JPY',
        value: q?.price || null,
        change: q?.change || null,
        change_pct: q?.change_pct || 0,
        currency: 'JPY',
      });
    } catch (e) {
      console.error('BTC-JPY error:', e);
      indicators.push({ key: 'btcjpy', label: 'BTC/JPY', value: null, error: 'Failed' });
    }

    const updatedAt = new Date().toISOString();
    return NextResponse.json({ indicators, updatedAt });
  } catch (e) {
    console.error('Market API error:', e);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
