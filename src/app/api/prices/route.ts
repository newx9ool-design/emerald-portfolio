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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get USD/JPY rate
    let usdJpy = 150;
    try {
      const rate = await getExchangeRate('USD', 'JPY');
      if (rate) usdJpy = rate;
    } catch {}

    const prices: Record<string, {
      livePrice: number;
      liveCurrency: string;
      liveValueJPY: number;
      purchaseValueJPY: number;
      diffJPY: number;
      priceSource: string;
    }> = {};

    for (const h of (holdings || [])) {
      const categoryCode = h.asset_categories?.code || '';
      const isCash = categoryCode === 'CASH';
      const isUSD = h.purchase_currency === 'USD';

      // Purchase value in JPY
      const purchaseLocal = h.quantity * h.avg_purchase_price;
      const purchaseValueJPY = isUSD ? purchaseLocal * usdJpy : purchaseLocal;

      if (isCash) {
        prices[h.id] = {
          livePrice: h.avg_purchase_price,
          liveCurrency: 'JPY',
          liveValueJPY: Math.round(purchaseLocal),
          purchaseValueJPY: Math.round(purchaseLocal),
          diffJPY: 0,
          priceSource: 'fixed',
        };
        continue;
      }

      // Try to get live price for all non-cash holdings with a symbol
      let livePrice = h.avg_purchase_price;
      let liveCurrency = h.purchase_currency || 'JPY';
      let priceSource = 'purchase';

      if (h.symbol) {
        try {
          const live = await getStockPrice(h.symbol);
          if (live && live.price > 0) {
            livePrice = live.price;
            liveCurrency = live.currency || liveCurrency;
            priceSource = 'live';
          }
        } catch {}
      }

      // Calculate live value in JPY
      const liveLocal = h.quantity * livePrice;
      let liveValueJPY: number;

      if (priceSource === 'live') {
        // Use the currency returned by Yahoo Finance
        if (liveCurrency === 'USD') {
          liveValueJPY = liveLocal * usdJpy;
        } else {
          // JPY or other currency that Yahoo returns (e.g. BTC-JPY returns JPY)
          liveValueJPY = liveLocal;
        }
      } else {
        // Fallback to purchase currency
        liveValueJPY = isUSD ? liveLocal * usdJpy : liveLocal;
      }

      prices[h.id] = {
        livePrice,
        liveCurrency,
        liveValueJPY: Math.round(liveValueJPY),
        purchaseValueJPY: Math.round(purchaseValueJPY),
        diffJPY: Math.round(liveValueJPY - purchaseValueJPY),
        priceSource,
      };
    }

    return NextResponse.json({ prices, usdJpy });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
