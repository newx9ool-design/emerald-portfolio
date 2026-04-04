import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

export async function GET(request: NextRequest) {
  // Vercel Cron 認証チェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // 全ユーザーの保有銘柄を取得
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('*');

    if (error) throw error;

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ message: '保有銘柄なし', count: 0 });
    }

    // 各銘柄のスナップショットを保存
    const snapshots = holdings.map((h) => ({
      holding_id: h.id,
      price_at_snapshot: h.avg_purchase_price,
      exchange_rate: 1,
      value_jpy: h.quantity * h.avg_purchase_price,
      snapshot_date: today,
    }));

    const { error: insertError } = await supabase
      .from('snapshots')
      .upsert(snapshots, { onConflict: 'holding_id,snapshot_date' });

    if (insertError) throw insertError;

    return NextResponse.json({
      message: 'スナップショット完了',
      count: snapshots.length,
      date: today,
    });
  } catch (error) {
    console.error('スナップショットエラー:', error);
    return NextResponse.json({ error: 'スナップショット失敗' }, { status: 500 });
  }
}
