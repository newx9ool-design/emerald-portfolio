export type AssetCategory = {
  id: string;
  code: string;
  name_ja: string;
  name_en: string;
};

export type Holding = {
  id: string;
  user_id: string;
  category_id: string;
  symbol: string;
  name_ja: string;
  quantity: number;
  avg_purchase_price: number;
  purchase_currency: string;
  memo: string;
  created_at: string;
  updated_at: string;
  asset_categories?: AssetCategory;
};

export type Snapshot = {
  id: string;
  holding_id: string;
  price_at_snapshot: number;
  exchange_rate: number;
  value_jpy: number;
  snapshot_date: string;
};

export type PriceData = {
  symbol: string;
  price: number;
  currency: string;
  change_pct?: number;
};
