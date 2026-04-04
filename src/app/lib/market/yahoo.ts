import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function getStockPrice(symbol: string) {
  try {
    const result: any = await yahooFinance.quote(symbol);
    return {
      symbol: result.symbol,
      price: result.regularMarketPrice || 0,
      currency: result.currency || 'JPY',
      change_pct: result.regularMarketChangePercent || 0,
    };
  } catch (error) {
    console.error('Yahoo Finance エラー:', error);
    return null;
  }
}

export async function searchSecurities(query: string) {
  try {
    const result: any = await yahooFinance.search(
      query,
      {},
      { validateResult: false }
    );

    return (result.quotes || [])
      .filter((q: any) => q.symbol)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol || '',
        type: q.typeDisp || q.quoteType || 'Unknown',
        exchange: q.exchange || q.exchDisp || '',
      }));
  } catch (error) {
    console.error('検索エラー:', error);
    return [];
  }
}
