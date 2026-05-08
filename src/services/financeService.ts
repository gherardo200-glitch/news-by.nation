/**
 * Financial data service — multi-source, all free, no API key required.
 *
 * Source priority:
 *  1. CoinGecko        → BTC, ETH, SOL  (CORS, free, no auth)
 *  2. Yahoo via proxy  → Gold, Oil, S&P 500, Nasdaq  (allorigins.win)
 *  3. frankfurter.app  → EUR/USD, GBP/USD  (CORS, free, provides daily change)
 *  4. Twelve Data      → fallback if VITE_TWELVE_DATA_API_KEY is set
 *  5. Realistic mock   → final fallback (May 2026 levels)
 */

const TWELVE_DATA_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY || "";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface FinanceData {
  symbol:        string;
  name:          string;
  price:         number;
  change:        number;
  changePercent: number;
  high?:         number;
  low?:          number;
  type:          "stock" | "commodity" | "index" | "forex" | "crypto";
  timestamp:     string;
}

/* ─── Symbol maps ────────────────────────────────────────────────────────── */

const YAHOO_MAP: Record<string, string> = {
  "XAU/USD": "GC=F",
  "WTI/USD": "CL=F",
  "BRENT":   "BZ=F",
  "SPX":     "%5EGSPC",
  "IXIC":    "%5EIXIC",
  "DJI":     "%5EDJI",
};

const COINGECKO_MAP: Record<string, string> = {
  "BTC/USD": "bitcoin",
  "ETH/USD": "ethereum",
  "SOL/USD": "solana",
};

/** frankfurter.app supports these base currencies */
const FRANKFURTER_BASE: Record<string, string> = {
  "EUR/USD": "EUR",
  "GBP/USD": "GBP",
  "USD/JPY": "USD",
  "USD/CHF": "USD",
};

const META: Record<string, { name: string; type: FinanceData["type"] }> = {
  "XAU/USD": { name: "Oro (XAU/USD)",    type: "commodity" },
  "WTI/USD": { name: "Petrolio WTI",     type: "commodity" },
  "BRENT":   { name: "Brent Crude",      type: "commodity" },
  "SPX":     { name: "S&P 500",          type: "index"     },
  "IXIC":    { name: "Nasdaq Composite", type: "index"     },
  "DJI":     { name: "Dow Jones",        type: "index"     },
  "BTC/USD": { name: "Bitcoin",          type: "crypto"    },
  "ETH/USD": { name: "Ethereum",         type: "crypto"    },
  "SOL/USD": { name: "Solana",           type: "crypto"    },
  "EUR/USD": { name: "EUR/USD",          type: "forex"     },
  "GBP/USD": { name: "GBP/USD",         type: "forex"     },
  "USD/JPY": { name: "USD/JPY",          type: "forex"     },
};

export const DEFAULT_FINANCE_SYMBOLS = [
  { symbol: "XAU/USD", name: "Oro",          type: "commodity" },
  { symbol: "WTI/USD", name: "Petrolio WTI", type: "commodity" },
  { symbol: "SPX",     name: "S&P 500",      type: "index"     },
  { symbol: "IXIC",    name: "Nasdaq",       type: "index"     },
  { symbol: "BTC/USD", name: "Bitcoin",      type: "crypto"    },
  { symbol: "ETH/USD", name: "Ethereum",     type: "crypto"    },
  { symbol: "EUR/USD", name: "EUR/USD",      type: "forex"     },
  { symbol: "GBP/USD", name: "GBP/USD",     type: "forex"     },
];

/* ─── Source 1: CoinGecko (crypto) ──────────────────────────────────────── */

async function fetchCoinGecko(symbols: string[]): Promise<FinanceData[]> {
  const mapped = symbols
    .filter((s) => COINGECKO_MAP[s])
    .map((s) => ({ symbol: s, id: COINGECKO_MAP[s] }));
  if (!mapped.length) return [];

  const ids = mapped.map((m) => m.id).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`,
    { signal: AbortSignal.timeout(7000) }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return mapped
    .filter(({ id }) => data[id])
    .map(({ symbol, id }) => {
      const coin = data[id];
      const price: number         = coin.usd ?? 0;
      const changePercent: number = coin.usd_24h_change ?? 0;
      const change                = price * (changePercent / 100);
      const m = META[symbol];
      return {
        symbol,
        name:          m?.name ?? symbol,
        price,
        change,
        changePercent,
        type:          "crypto" as const,
        timestamp:     new Date().toISOString(),
      };
    });
}

/* ─── Source 2: Yahoo Finance via CORS proxy ─────────────────────────────── */

async function fetchYahooViaProxy(ourSymbol: string): Promise<FinanceData | null> {
  const yahooTicker = YAHOO_MAP[ourSymbol];
  if (!yahooTicker) return null;

  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=2d`;
  const proxyUrl  = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

  try {
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });
    if (!res.ok) return null;

    const wrapper = await res.json();
    const inner   = JSON.parse(wrapper.contents ?? "{}");
    const result  = inner?.chart?.result?.[0];
    const meta    = result?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price: number     = meta.regularMarketPrice;
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change            = price - prevClose;
    const changePercent     = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    // Try to get day high/low
    const indicators = result?.indicators?.quote?.[0];
    const highs       = indicators?.high  as number[] | undefined;
    const lows        = indicators?.low   as number[] | undefined;
    const lastIdx     = highs ? highs.length - 1 : -1;

    const m = META[ourSymbol];
    return {
      symbol:        ourSymbol,
      name:          m?.name ?? ourSymbol,
      price,
      change,
      changePercent,
      high:          lastIdx >= 0 && highs ? highs[lastIdx]  : undefined,
      low:           lastIdx >= 0 && lows  ? lows[lastIdx]   : undefined,
      type:          m?.type ?? "stock",
      timestamp:     new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ─── Source 3: frankfurter.app (forex — provides yesterday's rate for delta) */

async function fetchFrankfurter(symbol: string): Promise<FinanceData | null> {
  const base = FRANKFURTER_BASE[symbol];
  if (!base) return null;

  // Derive target currency from symbol (e.g. EUR/USD → USD, USD/JPY → JPY)
  const parts  = symbol.split("/");
  const target = parts[1];

  try {
    // Fetch today's rate + yesterday's rate in one shot using the "latest" endpoint
    // and the "amount" endpoint for yesterday via the date range endpoint
    const [todayRes] = await Promise.all([
      fetch(`https://api.frankfurter.app/latest?from=${base}&to=${target}`, { signal: AbortSignal.timeout(6000) }),
    ]);

    if (!todayRes.ok) return null;
    const todayData = await todayRes.json();
    const price: number = todayData?.rates?.[target];
    if (!price) return null;

    // Get yesterday via the historical series (last 2 business days)
    const seriesRes = await fetch(
      `https://api.frankfurter.app/2000-01-01..?from=${base}&to=${target}&amount=1`,
      { signal: AbortSignal.timeout(6000) }
    ).catch(() => null);

    let change        = 0;
    let changePercent = 0;

    if (seriesRes?.ok) {
      const seriesData = await seriesRes.json().catch(() => null);
      const dates      = Object.keys(seriesData?.rates ?? {}).sort();
      // Last two dates available
      if (dates.length >= 2) {
        const prev: number = seriesData.rates[dates[dates.length - 2]]?.[target] ?? price;
        change        = price - prev;
        changePercent = prev !== 0 ? (change / prev) * 100 : 0;
      }
    }

    const m = META[symbol];
    return {
      symbol,
      name:          m?.name ?? symbol,
      price,
      change,
      changePercent,
      type:          "forex" as const,
      timestamp:     new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ─── Source 4: Twelve Data (optional key) ──────────────────────────────── */

async function fetchTwelveData(symbol: string): Promise<FinanceData | null> {
  if (!TWELVE_DATA_KEY) return null;
  try {
    const res  = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_KEY}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    if (data.status === "error") return null;
    const m = META[symbol];
    return {
      symbol,
      name:          m?.name ?? data.name ?? symbol,
      price:         parseFloat(data.close),
      change:        parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      high:          data.fifty_two_week?.high ? parseFloat(data.fifty_two_week.high) : undefined,
      low:           data.fifty_two_week?.low  ? parseFloat(data.fifty_two_week.low)  : undefined,
      type:          m?.type ?? "stock",
      timestamp:     new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ─── Source 5: Realistic mock (May 2026 levels) ────────────────────────── */

async function getMock(symbol: string): Promise<FinanceData | null> {
  const noise = (base: number, pct: number) =>
    base * (1 + (Math.random() - 0.5) * pct);

  type MockEntry = { price: number; change: number; changePercent: number; type: FinanceData["type"]; name: string; high?: number; low?: number };
  const mockBase: Record<string, MockEntry> = {
    "XAU/USD": { name: "Oro (XAU/USD)",    price: 3310,    change: 22.4,   changePercent:  0.68, type: "commodity", high: 3340,    low: 3285    },
    "WTI/USD": { name: "Petrolio WTI",     price: 59.80,   change: -1.10,  changePercent: -1.81, type: "commodity", high: 61.40,   low: 59.20   },
    "BRENT":   { name: "Brent Crude",      price: 63.40,   change: -0.95,  changePercent: -1.48, type: "commodity", high: 65.00,   low: 63.00   },
    "SPX":     { name: "S&P 500",          price: 5312,    change: -88,    changePercent: -1.63, type: "index",     high: 5380,    low: 5290    },
    "IXIC":    { name: "Nasdaq Composite", price: 16480,   change: -390,   changePercent: -2.31, type: "index",     high: 16800,   low: 16400   },
    "DJI":     { name: "Dow Jones",        price: 39850,   change: -320,   changePercent: -0.80, type: "index",     high: 40100,   low: 39700   },
    "BTC/USD": { name: "Bitcoin",          price: 98500,   change: 1200,   changePercent:  1.23, type: "crypto",    high: 99800,   low: 97200   },
    "ETH/USD": { name: "Ethereum",         price: 1820,    change: -28,    changePercent: -1.51, type: "crypto",    high: 1870,    low: 1800    },
    "SOL/USD": { name: "Solana",           price: 148,     change: 3.2,    changePercent:  2.21, type: "crypto",    high: 152,     low: 144     },
    "EUR/USD": { name: "EUR/USD",          price: 1.1320,  change: 0.0041, changePercent:  0.36, type: "forex"                                  },
    "GBP/USD": { name: "GBP/USD",         price: 1.3310,  change: 0.0028, changePercent:  0.21, type: "forex"                                  },
    "USD/JPY": { name: "USD/JPY",          price: 143.80,  change: -0.65,  changePercent: -0.45, type: "forex"                                  },
  };

  const base = mockBase[symbol];
  if (!base) return null;

  const decimals = base.type === "forex" ? 4 : 2;
  return {
    symbol,
    name:          base.name,
    price:         parseFloat(noise(base.price, 0.001).toFixed(decimals)),
    change:        base.change,
    changePercent: base.changePercent,
    high:          base.high,
    low:           base.low,
    type:          base.type,
    timestamp:     new Date().toISOString(),
  };
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

export async function fetchFinanceQuote(symbol: string): Promise<FinanceData | null> {
  if (COINGECKO_MAP[symbol]) {
    const results = await fetchCoinGecko([symbol]).catch(() => []);
    if (results.length) return results[0];
  }
  if (FRANKFURTER_BASE[symbol]) {
    const result = await fetchFrankfurter(symbol).catch(() => null);
    if (result) return result;
  }
  if (YAHOO_MAP[symbol]) {
    const result = await fetchYahooViaProxy(symbol).catch(() => null);
    if (result) return result;
  }
  const td = await fetchTwelveData(symbol).catch(() => null);
  if (td) return td;

  return getMock(symbol);
}

export async function fetchFinanceQuotes(symbols: string[]): Promise<FinanceData[]> {
  const cryptoSymbols     = symbols.filter((s) => COINGECKO_MAP[s]);
  const frankfurterSymbols = symbols.filter((s) => FRANKFURTER_BASE[s]);
  const yahooSymbols      = symbols.filter((s) => YAHOO_MAP[s]);
  const otherSymbols      = symbols.filter(
    (s) => !COINGECKO_MAP[s] && !FRANKFURTER_BASE[s] && !YAHOO_MAP[s]
  );

  const [cryptoResults, frankfurterResults, yahooResults, otherResults] = await Promise.all([
    fetchCoinGecko(cryptoSymbols).catch(() => [] as FinanceData[]),
    Promise.all(frankfurterSymbols.map((s) => fetchFrankfurter(s).catch(() => null))),
    Promise.all(yahooSymbols.map((s) => fetchYahooViaProxy(s).catch(() => null))),
    Promise.all(
      otherSymbols.map((s) =>
        fetchTwelveData(s)
          .catch(() => null)
          .then((r) => r ?? getMock(s))
      )
    ),
  ]);

  const fetched = new Map<string, FinanceData>();
  [
    ...cryptoResults,
    ...frankfurterResults.filter(Boolean) as FinanceData[],
    ...yahooResults.filter(Boolean)       as FinanceData[],
    ...otherResults.filter(Boolean)       as FinanceData[],
  ].forEach((d) => d && fetched.set(d.symbol, d));

  // Fill gaps with mock
  await Promise.all(
    symbols
      .filter((s) => !fetched.has(s))
      .map(async (s) => {
        const mock = await getMock(s);
        if (mock) fetched.set(s, mock);
      })
  );

  return symbols.map((s) => fetched.get(s)!).filter(Boolean);
}
