export async function getCryptoPrice(coinId: string) {
  try {
    const apiKey = process.env.COINGECKO_API_KEY || '';
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=jpy,usd&include_24hr_change=true`,
      { headers, next: { revalidate: 300 } }
    );

    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);

    const data = await res.json();
    const coin = data[coinId];

    if (!coin) return null;

    return {
      symbol: coinId,
      price: coin.jpy || 0,
      currency: 'JPY',
      change_pct: coin.jpy_24h_change || 0,
    };
  } catch (error) {
    console.error('CoinGecko エラー:', error);
    return null;
  }
}
