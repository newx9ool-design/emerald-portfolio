import { NextRequest, NextResponse } from 'next/server';
import { searchSecurities, quoteSummary } from '@/app/lib/market/yahoo';

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

// Check if query is a stock code number (e.g. 7203, 9984)
function isStockCode(query: string): boolean {
  return /^\d{4}$/.test(query.trim());
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Search query required' }, { status: 400 });
  }

  try {
    const trimmed = q.trim();
    const allResults: { symbol: string; name: string; type: string; exchange: string }[] = [];

    // Case 1: 4-digit stock code -> directly look up TSE symbol
    if (isStockCode(trimmed)) {
      const tseSymbol = trimmed + '.T';
      const quote = await quoteSummary(tseSymbol);
      if (quote) {
        allResults.push({
          symbol: quote.symbol,
          name: quote.name,
          type: quote.type,
          exchange: quote.exchange,
        });
      }
      // Also search Yahoo for other matches
      const yahooResults = await searchSecurities(trimmed);
      for (const yr of yahooResults) {
        if (!allResults.find(r => r.symbol === yr.symbol)) {
          allResults.push(yr);
        }
      }
      return NextResponse.json(allResults);
    }

    // Case 2: Japanese keyword
    if (containsJapanese(trimmed)) {
      const englishQuery = translateQuery(trimmed);

      // Search with English translation
      const yahooResults = await searchSecurities(englishQuery);

      // Separate TSE (.T) results and others
      const tseResults = yahooResults.filter((r: any) => r.symbol.endsWith('.T'));
      const otherResults = yahooResults.filter((r: any) => !r.symbol.endsWith('.T'));

      // TSE first, then others
      allResults.push(...tseResults, ...otherResults);

      // If no TSE results found, also try original Japanese query
      if (tseResults.length === 0) {
        const japResults = await searchSecurities(trimmed);
        const japTse = japResults.filter((r: any) => r.symbol.endsWith('.T'));
        for (const jr of japTse) {
          if (!allResults.find(r => r.symbol === jr.symbol)) {
            allResults.unshift(jr);
          }
        }
        for (const jr of japResults) {
          if (!allResults.find(r => r.symbol === jr.symbol)) {
            allResults.push(jr);
          }
        }
      }

      return NextResponse.json(allResults);
    }

    // Case 3: English / symbol query
    const yahooResults = await searchSecurities(trimmed);

    // Prioritize .T results
    const tseResults = yahooResults.filter((r: any) => r.symbol.endsWith('.T'));
    const otherResults = yahooResults.filter((r: any) => !r.symbol.endsWith('.T'));
    allResults.push(...tseResults, ...otherResults);

    return NextResponse.json(allResults);
  } catch (e) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
