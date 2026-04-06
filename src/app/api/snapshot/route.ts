import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getExchangeRate } from '@/app/lib/market/frankfurter';
import { getStockPrice } from '@/app/lib/market/yahoo';

// GET - fetch snapshot history
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('snapshot_date, total_value_jpy')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const history = (data || []).map((row: any) => ({
      date: row.snapshot_date,
      valueJPY: Number(row.total_value_jpy),
    }));

    return NextResponse.json(history);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

// POST - calculate current value and save today's snapshot
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all holdings
    const { data: holdings, error: holdErr } = await supabase
      .from('holdings')
      .select('*, asset_categories(*)')
      .eq('user_id', user.id);

    if (holdErr) return NextResponse.json({ error: holdErr.message }, { status: 500 });

    // Get USD/JPY rate
    let usdJpy = 150;
    try {
      const rate = await getExchangeRate('USD', 'JPY');
      if (rate) usdJpy = rate;
    } catch {}

    // Calculate total value with live prices
    let totalValueJPY = 0;
    const details: any[] = [];

    for (const h of (holdings || [])) {
      const categoryCode = h.asset_categories?.code || '';
      const isCash = categoryCode === 'CASH';
      const isUSD = h.purchase_currency === 'USD';

      let unitPrice = h.avg_purchase_price;
      let priceSource = 'purchase';

      // Try to get live price for non-cash holdings
      if (!isCash && h.symbol && !h.symbol.includes('-')) {
        try {
          const live = await getStockPrice(h.symbol);
          if (live && live.price > 0) {
            unitPrice = live.price;
            priceSource = 'live';
          }
        } catch {}
      }

      let valueJPY: number;
      if (isCash) {
        valueJPY = h.quantity * h.avg_purchase_price;
      } else {
        const localValue = h.quantity * unitPrice;
        if (priceSource === 'live') {
          // Live price is in the stock's currency
          const liveCurrency = isUSD ? 'USD' : 'JPY';
          valueJPY = liveCurrency === 'USD' ? localValue * usdJpy : localValue;
        } else {
          valueJPY = isUSD ? localValue * usdJpy : localValue;
        }
      }

      totalValueJPY += valueJPY;
      details.push({
        symbol: h.symbol,
        name: h.name_ja,
        unitPrice,
        priceSource,
        valueJPY: Math.round(valueJPY),
      });
    }

    totalValueJPY = Math.round(totalValueJPY);

    // Save snapshot (upsert by date)
    const today = new Date().toISOString().split('T')[0];
    const { error: upsertErr } = await supabase
      .from('portfolio_snapshots')
      .upsert(
        {
          user_id: user.id,
          snapshot_date: today,
          total_value_jpy: totalValueJPY,
        },
        { onConflict: 'user_id,snapshot_date' }
      );

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    return NextResponse.json({
      message: 'Snapshot saved',
      date: today,
      totalValueJPY,
      usdJpy,
      details,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 });
  }
}
