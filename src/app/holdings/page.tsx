'use client';
import { useState } from 'react';
import { useHoldings } from '@/app/hooks/useHoldings';
import { useExchangeRate } from '@/app/hooks/useExchangeRate';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Loading } from '@/app/components/ui/Loading';

type PriceInfo = {
  livePrice: number;
  liveCurrency: string;
  liveValueJPY: number;
  purchaseValueJPY: number;
  diffJPY: number;
};

export default function HoldingsPage() {
  const { holdings, loading, error, editHolding, refetch } = useHoldings();
  const { rate: usdJpy, loading: rateLoading } = useExchangeRate('USD', 'JPY');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name_ja: '', quantity: '', avg_purchase_price: '',
    purchase_currency: 'JPY', memo: '',
  });

  const [livePrices, setLivePrices] = useState<Record<string, PriceInfo>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceUpdated, setPriceUpdated] = useState(false);

  if (loading || rateLoading) return <Loading message="Loading..." />;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  const isUSD = (c: string) => c === 'USD';
  const isCash = (c: string) => c === 'CASH';
  const isCrypto = (c: string) => c === 'CRYPTO';

  const handleFetchPrices = async () => {
    setPriceLoading(true);
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLivePrices(data.prices || {});
      setPriceUpdated(true);
      setMessage('Prices updated');
      setTimeout(() => setMessage(''), 5000);
    } catch {
      setMessage('Failed to update prices');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleEditClick = (h: any) => {
    setEditId(h.id);
    setConfirmId(null);
    const code = h.asset_categories?.code || '';
    if (isCash(code)) {
      setEditForm({
        name_ja: h.name_ja || '',
        quantity: String(Math.round(h.quantity * h.avg_purchase_price)),
        avg_purchase_price: '1',
        purchase_currency: h.purchase_currency || 'JPY',
        memo: h.memo || '',
      });
    } else {
      setEditForm({
        name_ja: h.name_ja || '',
        quantity: String(h.quantity),
        avg_purchase_price: String(h.avg_purchase_price),
        purchase_currency: h.purchase_currency || 'JPY',
        memo: h.memo || '',
      });
    }
  };

  const handleEditSave = async (h: any) => {
    const code = h.asset_categories?.code || '';
    let qty: number;
    let price: number;

    if (isCash(code)) {
      const amount = Number(editForm.quantity);
      if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      qty = amount;
      price = 1;
    } else {
      qty = Number(editForm.quantity);
      price = Number(editForm.avg_purchase_price);
      if (!qty || qty <= 0 || !price || price <= 0) {
        alert('Please enter valid quantity and price');
        return;
      }
    }

    try {
      await editHolding({
        id: h.id, name_ja: editForm.name_ja, quantity: qty,
        avg_purchase_price: price, purchase_currency: editForm.purchase_currency,
        memo: editForm.memo,
      });
      setEditId(null);
      setMessage(editForm.name_ja + ' updated');
      setTimeout(() => setMessage(''), 5000);
    } catch {
      alert('Update failed');
    }
  };

  const handleSellClick = (h: any) => {
    const code = h.asset_categories?.code || '';
    setConfirmId(h.id);
    setEditId(null);
    if (isCash(code)) {
      setSellQuantity(String(Math.round(h.quantity * h.avg_purchase_price)));
    } else {
      setSellQuantity(String(h.quantity));
    }
  };

  const handleCancel = () => {
    setConfirmId(null);
    setEditId(null);
    setSellQuantity('');
  };

  const handleDelete = async (h: any) => {
    const categoryCode = h.asset_categories?.code || '';
    const qty = Number(sellQuantity);
    const totalCash = h.quantity * h.avg_purchase_price;

    if (isCash(categoryCode)) {
      if (!qty || qty <= 0 || qty > totalCash) {
        alert('Invalid amount');
        return;
      }
    } else {
      if (!qty || qty <= 0 || qty > h.quantity) {
        alert('Invalid quantity');
        return;
      }
      if (!isCrypto(categoryCode) && !Number.isInteger(qty)) {
        alert('Integer only for non-crypto');
        return;
      }
    }

    setDeletingId(h.id);
    try {
      const res = await fetch('/api/holdings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: h.id, quantity: qty }),
      });
      if (!res.ok) throw new Error('Failed');
      await refetch();

      if (isCash(categoryCode)) {
        setMessage(qty >= totalCash
          ? h.name_ja + ' fully deleted'
          : h.name_ja + ': deleted Y' + Math.round(qty).toLocaleString());
      } else {
        const localVal = qty * h.avg_purchase_price;
        const jpyVal = isUSD(h.purchase_currency) && usdJpy
          ? Math.round(localVal * usdJpy) : Math.round(localVal);
        setMessage(h.name_ja + ': sold ' + qty + ' -> Y' + jpyVal.toLocaleString() + ' cash');
      }
      setTimeout(() => setMessage(''), 5000);
    } catch {
      alert('Failed');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
      setSellQuantity('');
    }
  };

  const renderEditPanel = (h: any) => {
    const categoryCode = h.asset_categories?.code || '';
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-left">
        <p className="text-sm font-semibold text-blue-800 mb-2">Edit</p>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <input type="text" value={editForm.name_ja}
              onChange={(e) => setEditForm({ ...editForm, name_ja: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{isCash(categoryCode) ? 'Amount (JPY)' : 'Quantity'}</p>
            <input type="number" value={editForm.quantity}
              onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
              step={isCash(categoryCode) ? '1' : isCrypto(categoryCode) ? '0.00001' : '1'} min="0"
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          {!isCash(categoryCode) && (
            <div>
              <p className="text-xs text-gray-500">Unit Price</p>
              <input type="number" value={editForm.avg_purchase_price}
                onChange={(e) => setEditForm({ ...editForm, avg_purchase_price: e.target.value })}
                min="0" className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
            </div>
          )}
          {!isCash(categoryCode) && (
            <div>
              <p className="text-xs text-gray-500">Currency</p>
              <select value={editForm.purchase_currency}
                onChange={(e) => setEditForm({ ...editForm, purchase_currency: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
              </select>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Memo</p>
            <input type="text" value={editForm.memo}
              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <Button onClick={() => handleEditSave(h)}>Save</Button>
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
        </div>
      </div>
    );
  };

  const renderSellPanel = (h: any) => {
    const categoryCode = h.asset_categories?.code || '';
    const totalLocal = h.quantity * h.avg_purchase_price;
    const currency = h.purchase_currency || 'JPY';

    return (
      <div className="mt-3 p-3 bg-red-50 rounded-lg text-left">
        {isCash(categoryCode) ? (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">
              Delete amount (balance: Y{Math.round(totalLocal).toLocaleString()})
            </p>
            <div className="flex gap-1 items-center">
              <span className="text-sm text-gray-500">Y</span>
              <input type="number" value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                min={1} max={Math.round(totalLocal)} step="1"
                className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
              <button type="button"
                onClick={() => setSellQuantity(String(Math.round(totalLocal)))}
                className="text-xs text-brand-600 underline">All</button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">
              Sell qty (holding: {h.quantity})
              {isCrypto(categoryCode) && ' *up to 5 decimals'}
            </p>
            <div className="flex gap-1 items-center">
              <input type="number" value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                min={isCrypto(categoryCode) ? 0.00001 : 1}
                max={h.quantity} step={isCrypto(categoryCode) ? '0.00001' : '1'}
                className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
              <button type="button"
                onClick={() => setSellQuantity(String(h.quantity))}
                className="text-xs text-brand-600 underline">All</button>
            </div>
            {sellQuantity && Number(sellQuantity) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {'Value: '}
                {isUSD(currency)
                  ? '$' + (Number(sellQuantity) * h.avg_purchase_price).toLocaleString()
                    + ' = Y' + Math.round(Number(sellQuantity) * h.avg_purchase_price * (usdJpy || 150)).toLocaleString()
                  : 'Y' + Math.round(Number(sellQuantity) * h.avg_purchase_price).toLocaleString()}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="danger" onClick={() => handleDelete(h)}
            disabled={deletingId === h.id}>
            {deletingId === h.id ? '...' : isCash(categoryCode) ? 'Delete' : 'Sell'}
          </Button>
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
        </div>
      </div>
    );
  };

  const formatDiff = (diff: number) => {
    if (diff > 0) return { text: '+Y' + diff.toLocaleString(), color: 'text-green-600' };
    if (diff < 0) return { text: '-Y' + Math.abs(diff).toLocaleString(), color: 'text-red-500' };
    return { text: 'Y0', color: 'text-gray-500' };
  };

  // Calculate totals
  let totalPurchaseJPY = 0;
  let totalLiveJPY = 0;
  holdings.forEach((h: any) => {
    const currency = h.purchase_currency || 'JPY';
    const localVal = h.quantity * h.avg_purchase_price;
    const jpyVal = isUSD(currency) && usdJpy ? localVal * usdJpy : localVal;
    totalPurchaseJPY += jpyVal;
    const price = livePrices[h.id];
    if (price) {
      totalLiveJPY += price.liveValueJPY;
    } else {
      totalLiveJPY += jpyVal;
    }
  });
  const totalDiff = totalLiveJPY - totalPurchaseJPY;
  const totalDiffFmt = formatDiff(Math.round(totalDiff));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-800">Holdings</h1>
        <div className="flex gap-2">
          <Button onClick={handleFetchPrices} disabled={priceLoading} variant="secondary">
            {priceLoading ? 'Updating...' : 'Update Prices'}
          </Button>
          <a href="/holdings/new"><Button>+ New</Button></a>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-brand-100 text-brand-800 rounded-lg text-sm font-medium">
          {message}
        </div>
      )}

      {priceUpdated && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <p className="text-xs text-gray-500">Total Cost</p>
            <p className="text-lg font-bold text-brand-800">Y{Math.round(totalPurchaseJPY).toLocaleString()}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Current Value</p>
            <p className="text-lg font-bold text-brand-800">Y{Math.round(totalLiveJPY).toLocaleString()}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Profit/Loss</p>
            <p className={'text-lg font-bold ' + totalDiffFmt.color}>{totalDiffFmt.text}</p>
          </Card>
        </div>
      )}

      {(!holdings || holdings.length === 0) ? (
        <Card><p className="text-center text-gray-400 py-8">No holdings yet</p></Card>
      ) : (
        <div className="space-y-3">
          {holdings.map((h: any) => {
            const totalLocal = h.quantity * h.avg_purchase_price;
            const currency = h.purchase_currency || 'JPY';
            const categoryCode = h.asset_categories?.code || 'OTHER';
            const totalJPY = isUSD(currency) && usdJpy ? totalLocal * usdJpy : totalLocal;
            const price = livePrices[h.id];
            const diff = price ? formatDiff(price.diffJPY) : null;

            return (
              <Card key={h.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-brand-800">{h.name_ja}</p>
                    <p className="text-sm text-gray-500">{h.symbol}</p>
                    <Badge code={categoryCode}>
                      {h.asset_categories?.name_ja || 'Other'}
                    </Badge>
                    {h.memo && <p className="text-xs text-gray-400 mt-1">{h.memo}</p>}
                  </div>
                  <div className="text-right">
                    {isCash(categoryCode) ? (
                      <p className="font-bold text-brand-700">
                        Y{Math.round(totalLocal).toLocaleString()}
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-400">
                          {h.quantity} shares x {isUSD(currency) ? '$' : 'Y'}
                          {h.avg_purchase_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Cost: {isUSD(currency)
                            ? '$' + totalLocal.toLocaleString() + ' (Y' + Math.round(totalJPY).toLocaleString() + ')'
                            : 'Y' + Math.round(totalLocal).toLocaleString()}
                        </p>
                        {price && !isCash(categoryCode) ? (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-400">
                              Now: {price.liveCurrency === 'USD' ? '$' : 'Y'}
                              {price.livePrice.toLocaleString()} /unit
                            </p>
                            <p className="font-bold text-brand-700">
                              Y{price.liveValueJPY.toLocaleString()}
                            </p>
                            <p className={'text-sm font-semibold ' + diff!.color}>
                              {diff!.text}
                            </p>
                          </div>
                        ) : !priceUpdated ? (
                          <p className="text-xs text-gray-300 mt-1">
                            Click &quot;Update Prices&quot; for live value
                          </p>
                        ) : null}
                      </div>
                    )}

                    {editId === h.id ? renderEditPanel(h)
                      : confirmId === h.id ? renderSellPanel(h)
                      : (
                        <div className="flex gap-3 mt-2 justify-end">
                          <button type="button" onClick={() => handleEditClick(h)}
                            className="text-sm text-blue-400 hover:text-blue-600 underline">Edit</button>
                          <button type="button" onClick={() => handleSellClick(h)}
                            className="text-sm text-red-400 hover:text-red-600 underline">
                            {isCash(categoryCode) ? 'Delete' : 'Sell'}
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
