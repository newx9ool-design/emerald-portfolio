import { createAdminClient } from '@/app/lib/supabase/admin';

type PriceData = {
  symbol: string;
  price: number;
  currency: string;
  change_pct?: number;
};

export async function getCachedPrice(symbol: string): Promise<PriceData | null> {
  try {
    const supabase = createAdminClient();
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('price_cache')
      .select('*')
      .eq('symbol', symbol)
      .gte('fetched_at', fifteenMinAgo)
      .single();

    if (!data) return null;

    return {
      symbol: data.symbol,
      price: data.price,
      currency: data.currency,
      change_pct: data.change_pct,
    };
  } catch {
    return null;
  }
}

export async function setCachedPrice(symbol: string, priceData: PriceData) {
  try {
    const supabase = createAdminClient();

    await supabase
      .from('price_cache')
      .upsert({
        symbol,
        price: priceData.price,
        currency: priceData.currency,
        change_pct: priceData.change_pct || 0,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'symbol' });
  } catch (error) {
    console.error('キャッシュ保存エラー:', error);
  }
}
