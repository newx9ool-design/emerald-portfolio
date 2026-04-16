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
      change: result.regularMarketChange || 0,
      previousClose: result.regularMarketPreviousClose || 0,
    };
  } catch (error) {
    console.error('Yahoo Finance quote error:', symbol, error);
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
    console.error('Yahoo Finance search error:', query, error);
    return [];
  }
}

export async function quoteLookup(symbol: string) {
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

export async function searchYahooAPI(query: string) {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&lang=en-US`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.quotes || [])
      .filter((q: any) => q.symbol)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol || '',
        type: q.typeDisp || q.quoteType || 'Unknown',
        exchange: q.exchange || q.exchDisp || '',
      }));
  } catch (error) {
    console.error('Yahoo API direct search error:', query, error);
    return [];
  }
}
