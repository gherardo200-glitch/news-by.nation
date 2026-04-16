/**
 * Financial data service — multi-source, all free, no API key required.
 *
 * Strategy:
 *  1. CoinGecko  → BTC, ETH  (direct CORS, free, no auth)
 *  2. allorigins.win proxy → Yahoo Finance → Gold, Oil, S&P 500, Nasdaq
 *  3. open.er-api.com → EUR/USD, GBP/USD  (direct CORS, free, no auth)
 *  4. Twelve Data (if VITE_TWELVE_DATA_API_KEY set)
 *  5. Realistic Apr-2026 mock as final fallback
 */

const TWELVE_DATA_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY || "";

/* ─── Types ───────────────────────────────────────────────────────── */

export interface FinanceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "commodity" | "index" | "forex" | "crypto";
  timestamp: string;
}

/* ─── Symbol maps ─────────────────────────────────────────────────── */

/** Our symbol → Yahoo Finance ticker */
const YAHOO_MAP: Record<string, string> = {
  "XAU/USD": "GC=F",
  "WTI/USD": "CL=F",
  "BRENT":   "BZ=F",
  "SPX":     "%5EGSPC",   // ^GSPC URL-encoded
  "IXIC":    "%5EIXIC",   // ^IXIC URL-encoded
};

/** Our symbol → CoinGecko coin id */
const COINGECKO_MAP: Record<string, string> = {
  "BTC/USD": "bitcoin",
  "ETH/USD": "ethereum",
  "SOL/USD": "solana",
};

/** Our symbol → currency pair for exchangerate API */
const FOREX_BASE: Record<string, string> = {
  "EUR/USD": "EUR",
  "GBP/USD": "GBP",
};

/** Display metadata */
const META: Record<string, { name: string; type: FinanceData["type"] }> = {
  "XAU/USD": { name: "Gold Spot",      type: "commodity" },
  "WTI/USD": { name: "Crude Oil WTI",  type: "commodity" },
  "BRENT":   { name: "Brent Crude",    type: "commodity" },
  "SPX":     { name: "S&P 500",        type: "index"     },
  "IXIC":    { name: "Nasdaq",         type: "index"     },
  "BTC/USD": { name: "Bitcoin",        type: "crypto"    },
  "ETH/USD": { name: "Ethereum",       type: "crypto"    },
  "EUR/USD": { name: "EUR/USD",        type: "forex"     },
  "GBP/USD": { name: "GBP/USD",       type: "forex"     },
};

export const DEFAULT_FINANCE_SYMBOLS = [
  { symbol: "XAU/USD", name: "Gold Spot",     type: "commodity" },
  { symbol: "WTI/USD", name: "Crude Oil WTI", type: "commodity" },
  { symbol: "SPX",     name: "S&P 500",       type: "index"     },
  { symbol: "IXIC",    name: "Nasdaq",        type: "index"     },
  { symbol: "BTC/USD", name: "Bitcoin",       type: "crypto"    },
  { symbol: "EUR/USD", name: "EUR/USD",       type: "forex"     },
];

/* ─── Source 1: CoinGecko (crypto) ───────────────────────────────── */

async function fetchCoinGecko(symbols: string[]): Promise<FinanceData[]> {
  const mapped = symbols
    .filter((s) => COINGECKO_MAP[s])
    .map((s) => ({ symbol: s, id: COINGECKO_MAP[s] }));
  if (!mapped.length) return [];

  const ids = mapped.map((m) => m.id).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { signal: AbortSignal.timeout(6000) }
  );
  const data = await res.json();

  return mapped
    .filter(({ id }) => data[id])
    .map(({ symbol, id }) => {
      const coin = data[id];
      const price: number = coin.usd;
      const changePercent: number = coin.usd_24h_change ?? 0;
      const change = price * (changePercent / 100);
      const m = META[symbol];
      return {
        symbol,
        name: m?.name ?? symbol,
        price,
        change,
        changePercent,
        type: "crypto",
        timestamp: new Date().toISOString(),
      };
    });
}

/* ─── Source 2: Yahoo Finance via CORS proxy (commodities/indices) ── */

async function fetchYahooViaProxy(ourSymbol: string): Promise<FinanceData | null> {
  const yahooTicker = YAHOO_MAP[ourSymbol];
  if (!yahooTicker) return null;

  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=2d`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

  try {
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const wrapper = await res.json();
    const inner = JSON.parse(wrapper.contents ?? "{}");
    const meta = inner?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price: number = meta.regularMarketPrice;
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    const m = META[ourSymbol];

    return {
      symbol: ourSymbol,
      name: m?.name ?? ourSymbol,
      price,
      change,
      changePercent,
      type: m?.type ?? "stock",
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ─── Source 3: open.er-api.com (forex) ──────────────────────────── */

async function fetchForex(symbol: string): Promise<FinanceData | null> {
  const base = FOREX_BASE[symbol];
  if (!base) return null;

  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${base}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    if (data.result !== "success") return null;

    const price: number = data.rates?.USD;
    if (!price) return null;

    const m = META[symbol];
    return {
      symbol,
      name: m?.name ?? symbol,
      price,
      change: 0,          // er-api doesn't provide daily change; show via mock delta
      changePercent: 0,
      type: "forex",
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ─── Source 4: Twelve Data (if key is set) ──────────────────────── */

async function fetchTwelveData(symbol: string): Promise<FinanceData | null> {
  if (!TWELVE_DATA_KEY) return null;
  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_KEY}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    if (data.status === "error") return null;
    const m = META[symbol];
    return {
      symbol,
      name: m?.name ?? data.name ?? symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      type: m?.type ?? "stock",
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ─── Source 5: Realistic mock (Apr 2026 levels) ─────────────────── */

async function getMock(symbol: string): Promise<FinanceData | null> {
  const noise = (base: number, pct: number) =>
    base * (1 + (Math.random() - 0.5) * pct);

  const mockBase: Record<string, { price: number; change: number; changePercent: number; type: FinanceData["type"]; name: string }> = {
    "XAU/USD": { name: "Gold Spot",     price: 3228,    change: 18.5,   changePercent: 0.58,  type: "commodity" },
    "WTI/USD": { name: "Crude Oil WTI", price: 62.10,   change: -1.40,  changePercent: -2.20, type: "commodity" },
    "BRENT":   { name: "Brent Crude",   price: 65.80,   change: -1.15,  changePercent: -1.72, type: "commodity" },
    "SPX":     { name: "S&P 500",       price: 5285,    change: -92.0,  changePercent: -1.71, type: "index"     },
    "IXIC":    { name: "Nasdaq",        price: 16318,   change: -430,   changePercent: -2.56, type: "index"     },
    "BTC/USD": { name: "Bitcoin",       price: 74653,   change: 680,    changePercent: 0.92,  type: "crypto"    },
    "ETH/USD": { name: "Ethereum",      price: 1564,    change: -22,    changePercent: -1.39, type: "crypto"    },
    "EUR/USD": { name: "EUR/USD",       price: 1.1362,  change: 0.0048, changePercent: 0.42,  type: "forex"     },
    "GBP/USD": { name: "GBP/USD",      price: 1.3248,  change: 0.0032, changePercent: 0.24,  type: "forex"     },
  };

  const base = mockBase[symbol];
  if (!base) return null;

  return {
    symbol,
    name: base.name,
    price: parseFloat(noise(base.price, 0.001).toFixed(base.type === "forex" ? 4 : 2)),
    change: base.change,
    changePercent: base.changePercent,
    type: base.type,
    timestamp: new Date().toISOString(),
  };
}

/* ─── Public API ──────────────────────────────────────────────────── */

/** Fetch a single symbol, trying all sources in order */
export async function fetchFinanceQuote(symbol: string): Promise<FinanceData | null> {
  // Crypto → CoinGecko
  if (COINGECKO_MAP[symbol]) {
    const results = await fetchCoinGecko([symbol]).catch(() => []);
    if (results.length) return results[0];
  }

  // Forex → open.er-api
  if (FOREX_BASE[symbol]) {
    const result = await fetchForex(symbol).catch(() => null);
    if (result) return result;
  }

  // Yahoo (via proxy) for commodities/indices
  if (YAHOO_MAP[symbol]) {
    const result = await fetchYahooViaProxy(symbol).catch(() => null);
    if (result) return result;
  }

  // Twelve Data
  const td = await fetchTwelveData(symbol).catch(() => null);
  if (td) return td;

  // Mock fallback
  return getMock(symbol);
}

/** Fetch multiple symbols concurrently, dispatching each to the right source */
export async function fetchFinanceQuotes(symbols: string[]): Promise<FinanceData[]> {
  const cryptoSymbols = symbols.filter((s) => COINGECKO_MAP[s]);
  const forexSymbols  = symbols.filter((s) => FOREX_BASE[s]);
  const yahooSymbols  = symbols.filter((s) => YAHOO_MAP[s]);
  const otherSymbols  = symbols.filter(
    (s) => !COINGECKO_MAP[s] && !FOREX_BASE[s] && !YAHOO_MAP[s]
  );

  const [cryptoResults, forexResults, yahooResults, otherResults] = await Promise.all([
    // 1. CoinGecko batch
    fetchCoinGecko(cryptoSymbols).catch(() => [] as FinanceData[]),
    // 2. Forex (parallel per symbol)
    Promise.all(forexSymbols.map((s) => fetchForex(s).catch(() => null))),
    // 3. Yahoo Finance via proxy (parallel per symbol)
    Promise.all(yahooSymbols.map((s) => fetchYahooViaProxy(s).catch(() => null))),
    // 4. Twelve Data or mock (parallel)
    Promise.all(
      otherSymbols.map((s) =>
        fetchTwelveData(s)
          .catch(() => null)
          .then((r) => r ?? getMock(s))
      )
    ),
  ]);

  // Merge, filtering nulls, then fill any still-missing symbols with mock
  const fetched = new Map<string, FinanceData>();
  [
    ...cryptoResults,
    ...forexResults.filter(Boolean) as FinanceData[],
    ...yahooResults.filter(Boolean) as FinanceData[],
    ...otherResults.filter(Boolean) as FinanceData[],
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

  // Return in original order
  return symbols.map((s) => fetched.get(s)!).filter(Boolean);
}
