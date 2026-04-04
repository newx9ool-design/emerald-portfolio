import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getExchangeRate } from '@/app/lib/market/frankfurter';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('*, asset_categories(*)')
      .eq('user_id', user.id);
    if (error) throw error;

    // USD→JPY レート取得（失敗時は150で計算）
    let usdJpy = 150;
    try {
      const rate = await getExchangeRate('USD', 'JPY');
      if (rate) usdJpy = rate;
    } catch {}

    const summary = {
      totalValueJPY: 0,
      usdJpyRate: usdJpy,
      categories: {} as Record<string, { name: string; totalJPY: number; count: number }>,
      holdingsCount: holdings?.length || 0,
    };

    holdings?.forEach((h: any) => {
      const cat = h.asset_categories?.code || 'OTHER';
      const name = h.asset_categories?.name_ja || 'その他';
      if (!summary.categories[cat]) {
        summary.categories[cat] = { name, totalJPY: 0, count: 0 };
      }
      const localValue = h.quantity * h.avg_purchase_price;
      const valueJPY = h.purchase_currency === 'USD' ? localValue * usdJpy : localValue;
      summary.categories[cat].totalJPY += valueJPY;
      summary.categories[cat].count += 1;
      summary.totalValueJPY += valueJPY;
    });

    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: 'データ取得失敗' }, { status: 500 });
  }
}
