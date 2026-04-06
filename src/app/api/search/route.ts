import { NextRequest, NextResponse } from 'next/server';
import { searchSecurities, quoteLookup, searchYahooAPI } from '@/app/lib/market/yahoo';

// 日本語→英語の変換マップ
const JA_KEYWORD_MAP: Record<string, string> = {
  'トヨタ': 'Toyota',
  'ソニー': 'Sony',
  '任天堂': 'Nintendo',
  'ソフトバンク': 'SoftBank',
  'ホンダ': 'Honda',
  'キーエンス': 'Keyence',
  'ファーストリテイリング': 'Fast Retailing',
  'ユニクロ': 'Fast Retailing',
  'リクルート': 'Recruit',
  'パナソニック': 'Panasonic',
  'シャープ': 'Sharp',
  '三菱商事': 'Mitsubishi Corp',
  '三菱UFJ': 'Mitsubishi UFJ',
  '三菱重工': 'Mitsubishi Heavy',
  '三井物産': 'Mitsui',
  '住友商事': 'Sumitomo Corp',
  'NTT': 'NTT',
  'KDDI': 'KDDI',
  '日産': 'Nissan',
  '日立': 'Hitachi',
  '東芝': 'Toshiba',
  '富士通': 'Fujitsu',
  'NEC': 'NEC',
  '村田': 'Murata',
  'デンソー': 'Denso',
  'ダイキン': 'Daikin',
  '花王': 'Kao',
  '資生堂': 'Shiseido',
  'アサヒ': 'Asahi',
  'キリン': 'Kirin',
  'サントリー': 'Suntory',
  '楽天': 'Rakuten',
  'メルカリ': 'Mercari',
  'マイクロソフト': 'Microsoft',
  'アップル': 'Apple',
  'アマゾン': 'Amazon',
  'グーグル': 'Google',
  'テスラ': 'Tesla',
  'メタ': 'Meta',
  'エヌビディア': 'NVIDIA',
  'ネットフリックス': 'Netflix',
  'ビットコイン': 'bitcoin',
  'イーサリアム': 'ethereum',
  'リップル': 'XRP',
  '仮想通貨': 'crypto',
  '国債': 'bond',
  '金': 'gold',
  '原油': 'crude oil',
  '銀': 'silver',
};

function translateQuery(query: string): string {
  if (JA_KEYWORD_MAP[query]) return JA_KEYWORD_MAP[query];
  for (const [ja, en] of Object.entries(JA_KEYWORD_MAP)) {
    if (query.includes(ja)) return en;
  }
  return query;
}

function containsJapanese(text: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

function isStockCode(query: string): boolean {
  return /^\d{4}$/.test(query.trim());
}

function dedup(results: any[]) {
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.symbol)) return false;
    seen.add(r.symbol);
    return true;
  });
}

function sortTseFirst(results: any[]) {
  const tse = results.filter(r => r.symbol.endsWith('.T'));
  const other = results.filter(r => !r.symbol.endsWith('.T'));
  return [...tse, ...other];
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Search query required' }, { status: 400 });
  }

  try {
    const trimmed = q.trim();
    let allResults: any[] = [];

    // Case 1: 4-digit stock code -> directly look up as TSE symbol
    if (isStockCode(trimmed)) {
      const tseSymbol = trimmed + '.T';
      const quote = await quoteLookup(tseSymbol);
      if (quote) {
        allResults.push({
          symbol: quote.symbol,
          name: quote.name,
          type: quote.type,
          exchange: quote.exchange,
        });
      }
      // Also try library search and direct API
      const [libResults, apiResults] = await Promise.all([
        searchSecurities(trimmed).catch(() => []),
        searchYahooAPI(trimmed).catch(() => []),
      ]);
      allResults = [...allResults, ...libResults, ...apiResults];
      return NextResponse.json(dedup(allResults));
    }

    // Case 2: Japanese keyword
    let searchQuery = trimmed;
    if (containsJapanese(trimmed)) {
      searchQuery = translateQuery(trimmed);
    }

    // Try all three methods in parallel
    const [libResults, apiResults, libOrigResults] = await Promise.all([
      searchSecurities(searchQuery).catch(() => []),
      searchYahooAPI(searchQuery).catch(() => []),
      containsJapanese(trimmed) && searchQuery !== trimmed
        ? searchSecurities(trimmed).catch(() => [])
        : Promise.resolve([]),
    ]);

    allResults = [...libResults, ...apiResults, ...libOrigResults];
    allResults = sortTseFirst(dedup(allResults));

    // If still no results, try direct quote lookup for common patterns
    if (allResults.length === 0) {
      // Try as-is (might be a symbol like AAPL)
      const quote = await quoteLookup(searchQuery).catch(() => null);
      if (quote) {
        allResults.push({
          symbol: quote.symbol,
          name: quote.name,
          type: quote.type,
          exchange: quote.exchange,
        });
      }
    }

    return NextResponse.json(allResults);
  } catch (e) {
    console.error('Search route error:', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
