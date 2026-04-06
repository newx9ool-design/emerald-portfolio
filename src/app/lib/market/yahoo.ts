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
    console.error('Yahoo Finance error:', error);
    return null;
  }
}

export async function searchSecurities(query: string) {
  try {
    const result: any = await yahooFinance.search(
      query,
      { newsCount: 0, quotesCount: 20 },
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
    console.error('Search error:', error);
    return [];
  }
}

export async function quoteSummary(symbol: string) {
  try {
    const result: any = await yahooFinance.quote(symbol);
    if (!result || !result.symbol) return null;
    return {
      symbol: result.symbol,
      name: result.longName || result.shortName || result.symbol,
      price: result.regularMarketPrice || 0,
      currency: result.currency || 'JPY',
      exchange: result.fullExchangeName || result.exchange || '',
      type: result.quoteType || 'Unknown',
    };
  } catch {
    return null;
  }
}
