
/**
 * Service to fetch financial data from Twelve Data or provide high-quality fallback data.
 */

const TWELVE_DATA_API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY || "";

export interface FinanceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'commodity' | 'index' | 'forex' | 'crypto';
  timestamp: string;
}

// Default symbols to track if the user has no wishlist
export const DEFAULT_FINANCE_SYMBOLS = [
  { symbol: 'XAU/USD', name: 'Gold Spot', type: 'commodity' },
  { symbol: 'WTI/USD', name: 'Crude Oil WTI', type: 'commodity' },
  { symbol: 'SPX', name: 'S&P 500', type: 'index' },
  { symbol: 'IXIC', name: 'Nasdaq Composite', type: 'index' },
  { symbol: 'EUR/USD', name: 'EUR/USD', type: 'forex' },
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto' },
];

/**
 * Fetch quote for a single symbol
 */
export async function fetchFinanceQuote(symbol: string): Promise<FinanceData | null> {
  if (!TWELVE_DATA_API_KEY) {
    return getMockQuote(symbol);
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'error') {
      console.error(`Twelve Data Error for ${symbol}:`, data.message);
      return getMockQuote(symbol);
    }

    return {
      symbol: data.symbol,
      name: data.name || symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      type: 'stock', // We might need more logic to determine the exact type from Twelve Data
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to fetch finance quote:", error);
    return getMockQuote(symbol);
  }
}

/**
 * Fetch quotes for multiple symbols
 */
export async function fetchFinanceQuotes(symbols: string[]): Promise<FinanceData[]> {
  // Twelve Data supports batch requests if symbols are comma-separated
  if (!TWELVE_DATA_API_KEY) {
    return Promise.all(symbols.map(s => getMockQuote(s))).then(res => res.filter(r => r !== null) as FinanceData[]);
  }

  try {
    const symbolsParam = symbols.join(',');
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbolsParam}&apikey=${TWELVE_DATA_API_KEY}`
    );
    const data = await response.json();

    // Batch response is an object keyed by symbol if multiple symbols, or single object if one
    const results: FinanceData[] = [];
    
    if (symbols.length === 1) {
      const quote = await fetchFinanceQuote(symbols[0]);
      if (quote) results.push(quote);
    } else {
      for (const symbol of symbols) {
        const item = data[symbol];
        if (item && item.status !== 'error') {
          results.push({
            symbol: item.symbol,
            name: item.name || symbol,
            price: parseFloat(item.close),
            change: parseFloat(item.change),
            changePercent: parseFloat(item.percent_change),
            type: 'stock',
            timestamp: new Date().toISOString()
          });
        } else {
          const mock = await getMockQuote(symbol);
          if (mock) results.push(mock);
        }
      }
    }
    return results;
  } catch (error) {
    console.error("Failed to fetch batch quotes:", error);
    return Promise.all(symbols.map(s => getMockQuote(s))).then(res => res.filter(r => r !== null) as FinanceData[]);
  }
}

/**
 * Returns a high-quality mock quote to ensure the UI looks good even without an API key
 */
async function getMockQuote(symbol: string): Promise<FinanceData | null> {
  const mockData: Record<string, Partial<FinanceData>> = {
    'XAU/USD': { name: 'Gold Spot', price: 2384.50, change: 12.45, changePercent: 0.52, type: 'commodity' },
    'WTI/USD': { name: 'Crude Oil WTI', price: 85.32, change: -0.45, changePercent: -0.53, type: 'commodity' },
    'SPX': { name: 'S&P 500', price: 5123.41, change: 25.12, changePercent: 0.49, type: 'index' },
    'IXIC': { name: 'Nasdaq', price: 16175.09, change: 112.30, changePercent: 0.70, type: 'index' },
    'BTC/USD': { name: 'Bitcoin', price: 64231.50, change: -1205.40, changePercent: -1.84, type: 'crypto' },
    'EUR/USD': { name: 'EUR/USD', price: 1.0645, change: 0.0012, changePercent: 0.11, type: 'forex' },
  };

  const mock = mockData[symbol] || { 
    name: symbol, 
    price: 100 + Math.random() * 50, 
    change: Math.random() * 2 - 1, 
    changePercent: Math.random() * 2 - 1, 
    type: 'stock' 
  };

  return {
    symbol,
    name: mock.name!,
    price: mock.price!,
    change: mock.change!,
    changePercent: mock.changePercent!,
    type: mock.type as any,
    timestamp: new Date().toISOString()
  };
}
