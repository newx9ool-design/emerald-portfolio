import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getExchangeRate } from '@/app/lib/market/frankfurter';

// GET - list holdings
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('holdings')
    .select('*, asset_categories(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - add holding
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('holdings')
      .insert({ ...body, user_id: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }
}

// PUT - edit holding
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, name_ja, quantity, avg_purchase_price, purchase_currency, memo } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name_ja) updateData.name_ja = name_ja;
    if (quantity) updateData.quantity = quantity;
    if (avg_purchase_price) updateData.avg_purchase_price = avg_purchase_price;
    if (purchase_currency) updateData.purchase_currency = purchase_currency;
    if (memo !== undefined) updateData.memo = memo;

    const { data, error } = await supabase
      .from('holdings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Updated', holding: data });
  } catch (e) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE - sell or remove holding
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, quantity } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { data: holding, error: fetchError } = await supabase
      .from('holdings')
      .select('*, asset_categories(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !holding) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const categoryCode = holding.asset_categories?.code || '';
    const isCash = categoryCode === 'CASH';

    if (isCash) {
      const totalCash = holding.quantity * holding.avg_purchase_price;
      const deleteAmount = quantity || totalCash;

      if (deleteAmount >= totalCash) {
        const { error: delErr } = await supabase
          .from('holdings').delete().eq('id', id).eq('user_id', user.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ message: 'Cash deleted', fullSell: true });
      } else {
        const remainingQty = (totalCash - deleteAmount) / holding.avg_purchase_price;
        const { error: updErr } = await supabase
          .from('holdings')
          .update({ quantity: remainingQty, updated_at: new Date().toISOString() })
          .eq('id', id).eq('user_id', user.id);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ message: 'Cash partially deleted', fullSell: false });
      }
    }

    // Non-cash: sell asset and convert to cash
    const sellQty = quantity || holding.quantity;
    if (sellQty > holding.quantity) {
      return NextResponse.json({ error: 'Exceeds holding quantity' }, { status: 400 });
    }

    let valueJPY = sellQty * holding.avg_purchase_price;
    if (holding.purchase_currency === 'USD') {
      let usdJpy = 150;
      try {
        const rate = await getExchangeRate('USD', 'JPY');
        if (rate) usdJpy = rate;
      } catch {}
      valueJPY = valueJPY * usdJpy;
    }
    valueJPY = Math.round(valueJPY);

    // Find or create CASH category
    const { data: cashCat } = await supabase
      .from('asset_categories').select('id').eq('code', 'CASH').single();

    if (cashCat) {
      const { data: existingCash } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('category_id', cashCat.id)
        .eq('symbol', 'JPY-CASH')
        .single();

      if (existingCash) {
        const newQty = Number(existingCash.quantity) + valueJPY;
        await supabase.from('holdings')
          .update({ quantity: newQty, avg_purchase_price: 1, updated_at: new Date().toISOString() })
          .eq('id', existingCash.id);
      } else {
        await supabase.from('holdings').insert({
          user_id: user.id,
          category_id: cashCat.id,
          symbol: 'JPY-CASH',
          name_ja: 'Cash (from sale)',
          quantity: valueJPY,
          avg_purchase_price: 1,
          purchase_currency: 'JPY',
          memo: 'Converted from sale',
        });
      }
    }

    // Delete or reduce holding
    const fullSell = sellQty >= holding.quantity;
    if (fullSell) {
      const { error: delErr } = await supabase
        .from('holdings').delete().eq('id', id).eq('user_id', user.id);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
    } else {
      const remaining = holding.quantity - sellQty;
      const { error: updErr } = await supabase
        .from('holdings')
        .update({ quantity: remaining, updated_at: new Date().toISOString() })
        .eq('id', id).eq('user_id', user.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Sold and converted to cash',
      fullSell,
      soldQuantity: sellQty,
      convertedJPY: valueJPY,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
