import { X, Clock, Star, TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchFinanceQuote, type FinanceData } from "../../services/financeService";
import { fetchNewsByCountryId } from "../../services/newsService";
import { subscribeToFinanceFavorites, toggleFinanceFavorite } from "../../services/userService";
import { trackCustomEvent } from "../../services/metaPixel";
import type { NewsArticle } from "../../data/mockNews";

/** Map our symbols → TradingView ticker strings */
const TV_TICKER: Record<string, string> = {
  "XAU/USD": "OANDA:XAUUSD",
  "WTI/USD": "NYMEX:CL1!",
  "BRENT":   "NYMEX:BZ1!",
  "SPX":     "SP:SPX",
  "IXIC":    "NASDAQ:COMP",
  "DJI":     "DJ:DJI",
  "BTC/USD": "BINANCE:BTCUSDT",
  "ETH/USD": "BINANCE:ETHUSDT",
  "SOL/USD": "BINANCE:SOLUSDT",
  "EUR/USD": "FX:EURUSD",
  "GBP/USD": "FX:GBPUSD",
  "USD/JPY": "FX:USDJPY",
};

interface FinancePanelProps {
  symbol: string | null;
  onClose: () => void;
}

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef    = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Remove previous widget
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    const tvSymbol = TV_TICKER[symbol] ?? symbol;

    const div = document.createElement("div");
    div.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(div);
    widgetRef.current = div;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol:          tvSymbol,
      width:           "100%",
      height:          "220",
      locale:          "it",
      dateRange:       "1M",
      colorTheme:      "dark",
      isTransparent:   true,
      autosize:        true,
      largeChartUrl:   "",
      chartOnly:       false,
      noTimeScale:     false,
    });

    containerRef.current.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
      if (containerRef.current) {
        const scripts = containerRef.current.querySelectorAll("script");
        scripts.forEach((s) => s.remove());
      }
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden rounded-2xl"
      style={{ height: 220 }}
    />
  );
}

export default function FinancePanel({ symbol, onClose }: FinancePanelProps) {
  const { currentUser } = useAuth();
  const [quote,      setQuote]      = useState<FinanceData | null>(null);
  const [news,       setNews]       = useState<NewsArticle[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadData = useCallback(async (sym: string, silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setQuote(null);
    setNews([]);

    try {
      const [q, fetchedNews] = await Promise.all([
        fetchFinanceQuote(sym),
        fetchNewsByCountryId(sym),
      ]);
      setQuote(q);
      setNews(fetchedNews.slice(0, 8));
    } catch (err) {
      console.error("FinancePanel: error loading data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!symbol) return;
    loadData(symbol);
  }, [symbol, loadData]);

  useEffect(() => {
    if (!currentUser || !symbol) return;
    const unsubscribe = subscribeToFinanceFavorites(currentUser.uid, (favs) => {
      setIsFavorite(favs.includes(symbol));
    });
    return () => unsubscribe();
  }, [currentUser, symbol]);

  const handleToggleFavorite = async () => {
    if (!currentUser || !symbol) return;
    try {
      if (!isFavorite) trackCustomEvent("AddToFinanceWishlist", { symbol });
      await toggleFinanceFavorite(currentUser.uid, symbol, !isFavorite);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  if (!symbol) return null;

  const isPositive = (quote?.changePercent ?? 0) >= 0;
  const changeColor = isPositive ? "text-emerald-400" : "text-rose-400";
  const changeBg    = isPositive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20";

  const fmt = (n: number | undefined, type: FinanceData["type"] | undefined) => {
    if (n === undefined) return "—";
    const isForex  = type === "forex";
    const decimals = isForex ? 4 : n >= 1000 ? 0 : 2;
    return n.toLocaleString("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="w-full h-full glass-panel rounded-t-[2.5rem] sm:rounded-none sm:border-l border-t sm:border-t-0 border-white/10 flex flex-col bg-[#050B14]/98 backdrop-blur-2xl">

      {/* Mobile drag bar */}
      <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0">
        <div className="w-12 h-1.5 bg-gray-500/50 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 sm:pt-7 pb-4 border-b border-white/5 bg-gray-900/30 sticky top-0 backdrop-blur-md z-10 rounded-t-3xl sm:rounded-none mt-2 sm:mt-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 truncate">
              {quote?.name ?? symbol}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{symbol}</p>
          </div>
          {currentUser && (
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full transition-all active:scale-90 flex-shrink-0 ${isFavorite ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
              title={isFavorite ? "Rimuovi dalla Watchlist" : "Aggiungi alla Watchlist"}
            >
              <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => symbol && loadData(symbol, true)}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
            title="Aggiorna"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 bg-white/5 sm:bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-16 sm:pb-7 scrollbar-hide">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-5 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <p className="text-xs uppercase tracking-widest animate-pulse font-bold">Caricamento dati mercato...</p>
          </div>
        ) : (
          <>
            {/* ── Price Metrics Card ─────────────────────────────────── */}
            {quote && (
              <div className="px-6 pt-5">
                <div className="bg-white/[0.03] rounded-2xl border border-white/8 p-5 relative overflow-hidden">
                  {/* Watermark icon */}
                  <div className={`absolute right-4 bottom-2 opacity-[0.04] ${changeColor}`}>
                    {isPositive
                      ? <TrendingUp className="w-20 h-20" />
                      : <TrendingDown className="w-20 h-20" />}
                  </div>

                  {/* Price + Change */}
                  <div className="flex items-end justify-between mb-4 relative z-10">
                    <div>
                      <p className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                        {fmt(quote.price, quote.type)}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">
                        Prezzo attuale
                      </p>
                    </div>
                    <div className={`flex flex-col items-end gap-1`}>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-sm font-bold ${changeBg} ${changeColor}`}>
                        {isPositive
                          ? <TrendingUp className="w-3.5 h-3.5" />
                          : <TrendingDown className="w-3.5 h-3.5" />}
                        {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                      </span>
                      <span className={`text-xs font-semibold ${changeColor}`}>
                        {isPositive ? "+" : ""}{fmt(quote.change, quote.type)} (1G)
                      </span>
                    </div>
                  </div>

                  {/* High / Low row */}
                  {(quote.high !== undefined || quote.low !== undefined) && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 relative z-10">
                      <div className="bg-black/20 rounded-xl px-3 py-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Massimo</p>
                        <p className="text-sm font-bold text-emerald-400">{fmt(quote.high, quote.type)}</p>
                      </div>
                      <div className="bg-black/20 rounded-xl px-3 py-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Minimo</p>
                        <p className="text-sm font-bold text-rose-400">{fmt(quote.low, quote.type)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TradingView Mini Chart ─────────────────────────────── */}
            <div className="px-6 pt-4">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Grafico — Ultimo Mese
              </p>
              <TradingViewChart symbol={symbol} />
            </div>

            {/* ── News Section ──────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Ultime Notizie di Mercato
              </p>

              {news.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-sm border border-dashed border-white/8 rounded-2xl">
                  Nessuna notizia disponibile per questo strumento.
                </div>
              ) : (
                <div className="space-y-3">
                  {news.map((item, idx) => (
                    <a
                      key={item.id}
                      href={item.url && item.url !== "#" ? item.url : undefined}
                      target={item.url && item.url !== "#" ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="block p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group"
                      style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.07}s both` }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold text-blue-300 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 truncate max-w-[120px]">
                          {item.source}
                        </span>
                        <span className="text-[9px] text-gray-600 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(item.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-300 group-hover:text-blue-200 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
