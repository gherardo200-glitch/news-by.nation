import { X, Clock, Star, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchFinanceQuote, type FinanceData } from "../../services/financeService";
import { fetchNewsByCountryId } from "../../services/newsService";
import { subscribeToFinanceFavorites, toggleFinanceFavorite } from "../../services/userService";
import { trackCustomEvent } from "../../services/metaPixel";
import type { NewsArticle } from "../../data/mockNews";

interface FinancePanelProps {
  symbol: string | null;
  onClose: () => void;
}

export default function FinancePanel({
  symbol,
  onClose,
}: FinancePanelProps) {
  const { currentUser } = useAuth();
  const [quote, setQuote] = useState<FinanceData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setIsLoading(true);
    setQuote(null);
    setNews([]);

    const loadData = async () => {
      try {
        const [q, fetchedNews] = await Promise.all([
          fetchFinanceQuote(symbol),
          fetchNewsByCountryId(symbol),  // symbol is now the direct key in realNews.json
        ]);
        setQuote(q);
        setNews(fetchedNews.slice(0, 6));
      } catch (err) {
        console.error("Error loading finance data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [symbol]);

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
      if (!isFavorite) trackCustomEvent('AddToFinanceWishlist', { symbol });
      await toggleFinanceFavorite(currentUser.uid, symbol, !isFavorite);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  if (!symbol) return null;

  return (
    <div className="w-full h-full glass-panel rounded-t-[2.5rem] sm:rounded-none sm:border-l border-t sm:border-t-0 border-white/10 flex flex-col bg-[#050B14]/95 backdrop-blur-2xl">
      
      {/* Mobile Swipe-bar Indicator */}
      <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0">
        <div className="w-12 h-1.5 bg-gray-500/50 rounded-full"></div>
      </div>

      <div className="flex items-center justify-between px-7 pt-6 sm:pt-7 pb-5 border-b border-white/5 bg-gray-900/30 sticky top-0 backdrop-blur-md z-10 rounded-t-3xl sm:rounded-none mt-2 sm:mt-0">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-extrabold">{symbol}</span>
            <span className="font-medium text-gray-300">Mercati</span>
          </h2>
          {currentUser && (
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full transition-all active:scale-90 ${isFavorite ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title={isFavorite ? "Rimuovi dalla Watchlist" : "Aggiungi alla Watchlist"}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 bg-white/5 sm:bg-transparent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-7 pb-16 sm:pb-7 space-y-8 scrollbar-hide">
        {/* Market Data Highlight */}
        {quote && (
          <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/10 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <TrendingUp className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{quote.name}</p>
                <p className="text-4xl font-display font-extrabold text-white">
                  {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`flex flex-col items-end ${quote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <div className="flex items-center font-bold text-lg">
                  {quote.change >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                  {quote.changePercent.toFixed(2)}%
                </div>
                <p className="text-xs font-medium opacity-80">{quote.change.toFixed(2)} (1D)</p>
              </div>
            </div>
          </div>
        )}

        {/* Latest News Section */}
        <div>
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Ultime Notizie di Mercato
          </h3>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
               <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
               <p className="text-[10px] uppercase tracking-widest animate-pulse">Recupero intelligence in corso...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-white/10 rounded-2xl">
              Nessuna notizia specifica trovata per questo strumento.
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item, idx) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all group"
                  style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold text-blue-300 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {item.source}
                    </span>
                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.timestamp).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-200 group-hover:text-blue-200 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
