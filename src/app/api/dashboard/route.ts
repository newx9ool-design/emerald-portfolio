import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getStockPrice } from '@/app/lib/market/yahoo';
import { getExchangeRate } from '@/app/lib/market/frankfurter';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('*, asset_categories(*)')
      .eq('user_id', user.id);
    if (error) throw error;

    let usdJpy = 150;
    try {
      const rate = await getExchangeRate('USD', 'JPY');
      if (rate) usdJpy = rate;
    } catch {}

    const summary = {
      totalValueJPY: 0,
      totalCostJPY: 0,
      usdJpyRate: usdJpy,
      categories: {} as Record<string, { name: string; totalJPY: number; costJPY: number; count: number }>,
      holdingsCount: holdings?.length || 0,
    };

    for (const h of (holdings || [])) {
      const cat = h.asset_categories?.code || 'OTHER';
      const name = h.asset_categories?.name_ja || 'Other';
      if (!summary.categories[cat]) {
        summary.categories[cat] = { name, totalJPY: 0, costJPY: 0, count: 0 };
      }

      const isUSD = h.purchase_currency === 'USD';
      const isCash = cat === 'CASH';

      // Purchase cost in JPY
      const purchaseLocal = h.quantity * h.avg_purchase_price;
      const costJPY = isUSD ? purchaseLocal * usdJpy : purchaseLocal;

      // Live value in JPY
      let liveValueJPY = costJPY;

      if (!isCash && h.symbol) {
        try {
          const live = await getStockPrice(h.symbol);
          if (live && live.price > 0) {
            const liveLocal = h.quantity * live.price;
            if (live.currency === 'USD') {
              liveValueJPY = liveLocal * usdJpy;
            } else {
              liveValueJPY = liveLocal;
            }
          }
        } catch {}
      }

      summary.categories[cat].totalJPY += liveValueJPY;
      summary.categories[cat].costJPY += costJPY;
      summary.categories[cat].count += 1;
      summary.totalValueJPY += liveValueJPY;
      summary.totalCostJPY += costJPY;
    }

    return NextResponse.json(summary);
  } catch (e) {
    console.error('Dashboard error:', e);
    return NextResponse.json({ error: 'Data fetch failed' }, { status: 500 });
  }
}
