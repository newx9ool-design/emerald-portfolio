import { NextResponse } from 'next/server';
import { getExchangeRate } from '@/app/lib/market/frankfurter';
import { getStockPrice } from '@/app/lib/market/yahoo';

export async function GET() {
  try {
    const results: Record<string, any> = {};

    // 1. USD/JPY
    try {
      const rate = await getExchangeRate('USD', 'JPY');
      results.usdjpy = {
        label: 'USD/JPY',
        value: rate,
        currency: '¥',
        source: 'Frankfurter API',
      };
    } catch (e) {
      console.error('USD/JPY error:', e);
      results.usdjpy = { label: 'USD/JPY', value: null, error: 'Failed to fetch' };
    }

    // 2. Nikkei 225 (^N225)
    try {
      const nikkei = await getStockPrice('^N225');
      results.nikkei = {
        label: 'Nikkei 225',
        value: nikkei?.price || null,
        change_pct: nikkei?.change_pct || 0,
        currency: '¥',
        symbol: '^N225',
      };
    } catch (e) {
      console.error('Nikkei error:', e);
      results.nikkei = { label: 'Nikkei 225', value: null, error: 'Failed to fetch' };
    }

    // 3. Dow Jones (^DJI)
    try {
      const dow = await getStockPrice('^DJI');
      results.dow = {
        label: 'NY Dow',
        value: dow?.price || null,
        change_pct: dow?.change_pct || 0,
        currency: '$',
        symbol: '^DJI',
      };
    } catch (e) {
      console.error('Dow error:', e);
      results.dow = { label: 'NY Dow', value: null, error: 'Failed to fetch' };
    }

    // 4. Bitcoin/JPY (BTC-JPY)
    try {
      const btc = await getStockPrice('BTC-JPY');
      results.btcjpy = {
        label: 'Bitcoin/JPY',
        value: btc?.price || null,
        change_pct: btc?.change_pct || 0,
        currency: '¥',
        symbol: 'BTC-JPY',
      };
    } catch (e) {
      console.error('BTC-JPY error:', e);
      results.btcjpy = { label: 'Bitcoin/JPY', value: null, error: 'Failed to fetch' };
    }

    // 5. eMAXIS Slim All Country (0331418A)
    try {
      const ac = await getStockPrice('0331418A.T');
      if (ac && ac.price > 0) {
        results.allcountry = {
          label: 'eMAXIS Slim All Country',
          value: ac.price,
          change_pct: ac.change_pct || 0,
          currency: '¥',
          symbol: '0331418A.T',
        };
      } else {
        // Fallback: try Yahoo Finance mutual fund symbol
        const ac2 = await getStockPrice('2559.T');
        results.allcountry = {
          label: 'MAXIS All Country (2559)',
          value: ac2?.price || null,
          change_pct: ac2?.change_pct || 0,
          currency: '¥',
          symbol: '2559.T',
        };
      }
    } catch (e) {
      console.error('All Country error:', e);
      try {
        const ac2 = await getStockPrice('2559.T');
        results.allcountry = {
          label: 'MAXIS All Country (2559)',
          value: ac2?.price || null,
          change_pct: ac2?.change_pct || 0,
          currency: '¥',
          symbol: '2559.T',
        };
      } catch {
        results.allcountry = { label: 'All Country', value: null, error: 'Failed to fetch' };
      }
    }

    const updatedAt = new Date().toISOString();

    return NextResponse.json({ indicators: results, updatedAt });
  } catch (e) {
    console.error('Market API error:', e);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
