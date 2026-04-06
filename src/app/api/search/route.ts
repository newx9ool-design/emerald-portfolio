import { NextRequest, NextResponse } from 'next/server';
import { searchSecurities } from '@/app/lib/market/yahoo';

// 日本語→英語/シンボルの変換マップ
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
  '三菱': 'Mitsubishi',
  '三井': 'Mitsui',
  '住友': 'Sumitomo',
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

// 日本語→東証コードの直接マップ
const JA_TSE_MAP: Record<string, { symbol: string; name: string }[]> = {
  'トヨタ': [
    { symbol: '7203.T', name: 'Toyota Motor Corp' },
  ],
  'ソニー': [
    { symbol: '6758.T', name: 'Sony Group Corp' },
  ],
  '任天堂': [
    { symbol: '7974.T', name: 'Nintendo Co Ltd' },
  ],
  'ソフトバンク': [
    { symbol: '9984.T', name: 'SoftBank Group Corp' },
    { symbol: '9434.T', name: 'SoftBank Corp' },
  ],
  'ホンダ': [
    { symbol: '7267.T', name: 'Honda Motor Co Ltd' },
  ],
  'キーエンス': [
    { symbol: '6861.T', name: 'Keyence Corp' },
  ],
  'ファーストリテイリング': [
    { symbol: '9983.T', name: 'Fast Retailing Co Ltd' },
  ],
  'ユニクロ': [
    { symbol: '9983.T', name: 'Fast Retailing Co Ltd' },
  ],
  'パナソニック': [
    { symbol: '6752.T', name: 'Panasonic Holdings Corp' },
  ],
  '三菱商事': [
    { symbol: '8058.T', name: 'Mitsubishi Corp' },
  ],
  '三菱UFJ': [
    { symbol: '8306.T', name: 'Mitsubishi UFJ Financial Group' },
  ],
  '三井物産': [
    { symbol: '8031.T', name: 'Mitsui & Co Ltd' },
  ],
  'NTT': [
    { symbol: '9432.T', name: 'Nippon Telegraph and Telephone Corp' },
  ],
  'KDDI': [
    { symbol: '9433.T', name: 'KDDI Corp' },
  ],
  '日産': [
    { symbol: '7201.T', name: 'Nissan Motor Co Ltd' },
  ],
  '日立': [
    { symbol: '6501.T', name: 'Hitachi Ltd' },
  ],
  '東芝': [
    { symbol: '6502.T', name: 'Toshiba Corp' },
  ],
  '富士通': [
    { symbol: '6702.T', name: 'Fujitsu Ltd' },
  ],
  'デンソー': [
    { symbol: '6902.T', name: 'Denso Corp' },
  ],
  'ダイキン': [
    { symbol: '6367.T', name: 'Daikin Industries Ltd' },
  ],
  '花王': [
    { symbol: '4452.T', name: 'Kao Corp' },
  ],
  '資生堂': [
    { symbol: '4911.T', name: 'Shiseido Co Ltd' },
  ],
  '楽天': [
    { symbol: '4755.T', name: 'Rakuten Group Inc' },
  ],
  'メルカリ': [
    { symbol: '4385.T', name: 'Mercari Inc' },
  ],
  'リクルート': [
    { symbol: '6098.T', name: 'Recruit Holdings Co Ltd' },
  ],
  '村田': [
    { symbol: '6981.T', name: 'Murata Manufacturing Co Ltd' },
  ],
  'シャープ': [
    { symbol: '6753.T', name: 'Sharp Corp' },
  ],
  'アサヒ': [
    { symbol: '2502.T', name: 'Asahi Group Holdings Ltd' },
  ],
  'キリン': [
    { symbol: '2503.T', name: 'Kirin Holdings Co Ltd' },
  ],
};

function translateQuery(query: string): string {
  if (JA_KEYWORD_MAP[query]) return JA_KEYWORD_MAP[query];
  for (const [ja, en] of Object.entries(JA_KEYWORD_MAP)) {
    if (query.includes(ja)) return en;
  }
  return query;
}

function getTseResults(query: string): { symbol: string; name: string; type: string; exchange: string }[] {
  // Exact match
  if (JA_TSE_MAP[query]) {
    return JA_TSE_MAP[query].map(item => ({
      symbol: item.symbol,
      name: item.name,
      type: 'Equity',
      exchange: 'TSE',
    }));
  }
  // Partial match
  const results: { symbol: string; name: string; type: string; exchange: string }[] = [];
  for (const [ja, items] of Object.entries(JA_TSE_MAP)) {
    if (query.includes(ja) || ja.includes(query)) {
      items.forEach(item => {
        if (!results.find(r => r.symbol === item.symbol)) {
          results.push({
            symbol: item.symbol,
            name: item.name,
            type: 'Equity',
            exchange: 'TSE',
          });
        }
      });
    }
  }
  return results;
}

function containsJapanese(text: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Search query required' }, { status: 400 });
  }

  try {
    let searchQuery = q.trim();
    let tseResults: { symbol: string; name: string; type: string; exchange: string }[] = [];

    if (containsJapanese(searchQuery)) {
      // Get TSE results from local map
      tseResults = getTseResults(searchQuery);
      // Translate for Yahoo search
      searchQuery = translateQuery(searchQuery);
    }

    // Search Yahoo Finance
    const yahooResults = await searchSecurities(searchQuery);

    // Merge: TSE first, then Yahoo results (deduplicated)
    const merged = [...tseResults];
    for (const yr of yahooResults) {
      if (!merged.find(m => m.symbol === yr.symbol)) {
        merged.push(yr);
      }
    }

    return NextResponse.json(merged);
  } catch (e) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
