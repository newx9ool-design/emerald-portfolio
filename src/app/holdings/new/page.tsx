'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

type Category = { id: string; code: string; name_ja: string };
type SearchResult = { symbol: string; name: string; type: string; exchange: string };

export default function NewHoldingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: '',
    symbol: '',
    name_ja: '',
    quantity: '',
    avg_purchase_price: '',
    purchase_currency: 'JPY',
    memo: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('asset_categories')
        .select('id, code, name_ja')
        .order('code');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStock = (result: SearchResult) => {
    setForm({
      ...form,
      symbol: result.symbol,
      name_ja: result.name || result.symbol,
    });
    setSearchResults([]);
    setSearched(false);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const symbol = form.symbol || generateSymbol(form.name_ja, getCategoryCode());

      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: form.category_id,
          symbol,
          name_ja: form.name_ja,
          quantity: Number(form.quantity),
          avg_purchase_price: Number(form.avg_purchase_price),
          purchase_currency: form.purchase_currency,
          memo: form.memo,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      router.push('/holdings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryCode = () => {
    const cat = categories.find(c => c.id === form.category_id);
    return cat?.code || 'OTHER';
  };

  const generateSymbol = (name: string, categoryCode: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const prefix = categoryCode || 'OTH';
    const nameSlug = name.slice(0, 4).toUpperCase();
    return `${prefix}-${nameSlug}-${timestamp}`;
  };

  const selectedCategoryCode = getCategoryCode();
  const isCash = selectedCategoryCode === 'CASH';

  const categoryOptions = [
    { value: '', label: '-- Select --' },
    ...categories.map(c => ({ value: c.id, label: c.name_ja })),
  ];

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-brand-800 mb-6">Add Holding</h1>
      <Card>
        <CardTitle>Holding Info</CardTitle>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Category */}
          <Input
            label="Category"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
            options={categoryOptions}
          />

          {/* Step 2: Search or manual input */}
          {form.category_id && !isCash && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-700 mb-1">
                Search Stock / Crypto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                  placeholder="Stock code (e.g. 7203) or name (e.g. Apple)"
                  className="flex-1 border border-brand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <Button type="button" onClick={handleSearch} disabled={searching}>
                  {searching ? '...' : 'Search'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                TSE stocks: use 4-digit code (e.g. 7203=Toyota, 1803=Shimizu)
              </p>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-brand-200 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.symbol}-${i}`}
                      type="button"
                      onClick={() => handleSelectStock(r)}
                      className="w-full text-left px-3 py-2 hover:bg-brand-50 border-b border-brand-100 last:border-b-0"
                    >
                      <p className="font-medium text-brand-800 text-sm">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.symbol} · {r.exchange} · {r.type}</p>
                    </button>
                  ))}
                </div>
              )}
              {searched && !searching && searchResults.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700">No results found</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    For Japanese stocks, try the 4-digit stock code instead of the company name.
                    You can find codes at Yahoo Finance Japan or your brokerage.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected stock info */}
          {form.symbol && !isCash && (
            <div className="mb-4 p-3 bg-brand-50 rounded-lg">
              <p className="text-sm text-brand-600">Selected:</p>
              <p className="font-semibold text-brand-800">{form.name_ja}</p>
              <p className="text-xs text-gray-500">{form.symbol}</p>
              <button
                type="button"
                onClick={() => setForm({ ...form, symbol: '', name_ja: '' })}
                className="text-xs text-red-400 hover:text-red-600 underline mt-1"
              >
                Clear
              </button>
            </div>
          )}

          {/* Cash: manual name */}
          {isCash && (
            <Input
              label="Name"
              name="name_ja"
              value={form.name_ja}
              onChange={handleChange}
              required
              placeholder="e.g. Savings, Emergency Fund"
            />
          )}

          {/* Step 3: Quantity and price */}
          {(form.symbol || isCash) && (
            <>
              <Input
                label={isCash ? 'Amount' : 'Quantity'}
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                required
                placeholder={isCash ? 'e.g. 1000000' : 'e.g. 100'}
              />
              {!isCash && (
                <Input
                  label="Avg Purchase Price"
                  name="avg_purchase_price"
                  type="number"
                  value={form.avg_purchase_price}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 2500"
                />
              )}
              <Input
                label="Currency"
                name="purchase_currency"
                value={form.purchase_currency}
                onChange={handleChange}
                options={[
                  { value: 'JPY', label: 'JPY' },
                  { value: 'USD', label: 'USD' },
                ]}
              />
              <Input
                label="Memo"
                name="memo"
                value={form.memo}
                onChange={handleChange}
                placeholder="Optional memo"
              />
              <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
                <button
                  type="button"
                  onClick={() => router.push('/holdings')}
                  className="px-4 py-2 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
