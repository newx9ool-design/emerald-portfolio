import { NextRequest, NextResponse } from 'next/server';
import { searchSecurities } from '@/app/lib/market/yahoo';

// よく検索される日本語→英語/シンボルの変換マップ
const JA_KEYWORD_MAP: Record<string, string> = {
  // 個別銘柄
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
  // 資産タイプ
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
  // 完全一致チェック
  if (JA_KEYWORD_MAP[query]) {
    return JA_KEYWORD_MAP[query];
  }
  // 部分一致チェック
  for (const [ja, en] of Object.entries(JA_KEYWORD_MAP)) {
    if (query.includes(ja)) {
      return en;
    }
  }
  return query;
}

// 日本語文字が含まれているか判定
function containsJapanese(text: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: '検索キーワードを入力してください' }, { status: 400 });
  }

  try {
    let searchQuery = q.trim();

    // 日本語が含まれている場合は英語に変換
    if (containsJapanese(searchQuery)) {
      searchQuery = translateQuery(searchQuery);
    }

    const results = await searchSecurities(searchQuery);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: '検索に失敗しました' }, { status: 500 });
  }
}
