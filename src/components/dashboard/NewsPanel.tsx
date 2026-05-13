import { X, Clock, ExternalLink, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { NewsArticle } from "../../data/mockNews";
import { useAuth } from "../../contexts/AuthContext";
import { toggleFavorite, subscribeToFavorites } from "../../services/userService";
import { trackCustomEvent } from "../../services/metaPixel";

interface NewsPanelProps {
  countryId: string | null;
  news: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  onClose: () => void;
}

export default function NewsPanel({
  countryId,
  news,
  isLoading,
  error,
  lastUpdated,
  onClose,
}: NewsPanelProps) {
  const { currentUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!currentUser || !countryId) return;
    const unsubscribe = subscribeToFavorites(currentUser.uid, (favs) => {
      setIsFavorite(favs.includes(countryId));
    });
    return () => unsubscribe();
  }, [currentUser, countryId]);

  const handleToggleStar = async () => {
    if (!currentUser || !countryId) return;

    if (!isFavorite) {
      // @ts-ignore
      if (window.gtag) window.gtag('event', 'add_to_watchlist', { country_id: countryId });
      trackCustomEvent('AddToWatchlist', { country: countryId });
    }

    try {
      await toggleFavorite(currentUser.uid, countryId, !isFavorite);
    } catch {
      // Silenced in production
    }
  };

  if (!countryId) return null;

  // Defense-in-depth: only render hrefs that are explicitly http(s).
  // The ingest pipeline filters these too, but Firestore data could in theory
  // be tampered with — never trust scraped URLs blindly.
  const safeUrl = (raw?: string): string | undefined => {
    if (!raw || raw === "#") return undefined;
    try {
      const u = new URL(raw);
      return (u.protocol === "https:" || u.protocol === "http:") ? raw : undefined;
    } catch {
      return undefined;
    }
  };

  return (
    <div className="w-full h-full glass-panel rounded-t-[2.5rem] sm:rounded-none sm:border-l border-t sm:border-t-0 border-white/10 flex flex-col bg-gray-900/90 backdrop-blur-2xl">

      {/* Mobile drag-bar indicator */}
      <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0">
        <div className="w-12 h-1.5 bg-gray-500/50 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-6 sm:pt-7 pb-4 border-b border-white/5 bg-gray-900/30 sticky top-0 backdrop-blur-md z-10 rounded-t-3xl sm:rounded-none mt-2 sm:mt-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-extrabold truncate">{countryId}</span>
              <span className="font-medium text-gray-300">Notizie</span>
            </h2>
            {lastUpdated && (
              <p className="text-[9px] text-gray-600 font-medium mt-0.5">
                Aggiornato: {new Date(lastUpdated).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          {currentUser && (
            <button
              onClick={handleToggleStar}
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

      {/* Content — pb-14 on mobile to avoid ticker overlap */}
      <div className="flex-1 overflow-y-auto p-7 pb-16 sm:pb-7 space-y-6 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 mt-10 text-gray-400">
            <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <p className="text-sm font-medium animate-pulse tracking-wide">Sincronizzazione fonti in corso...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm font-medium text-red-300 bg-red-900/20 rounded-2xl border border-red-500/20 backdrop-blur-md shadow-lg shadow-red-900/10">
            {error}
          </div>
        ) : news.length === 0 ? (
          <div className="p-12 mt-10 text-center text-gray-500 flex flex-col items-center">
            <p className="text-lg font-medium text-gray-400">Nessuna notizia trovata</p>
            <p className="text-sm text-gray-500 mt-2">Dati non disponibili per questa regione.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {news.map((item, idx) => {
              const href = safeUrl(item.url);
              return (
              <a
                key={item.id}
                href={href}
                target={href ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="group block p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)] relative overflow-hidden"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-cyan-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out" />

                <div className="flex items-start justify-between mb-4">
                  <span className="text-[11px] font-bold text-blue-300 tracking-wider uppercase bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    {item.source}
                  </span>
                  <div className="flex items-center text-[11px] text-gray-500 font-medium bg-black/20 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3 mr-1.5 opacity-70" />
                    {new Date(item.timestamp).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-100 leading-snug group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 transition-all duration-300">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed font-light line-clamp-3">
                  {item.excerpt.replace(/&nbsp;/g, ' ')}
                </p>

                <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
                  {href ? (
                    <span className="text-xs font-semibold text-blue-400 flex items-center group-hover:text-blue-300 transition-colors">
                      Leggi articolo <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      Aggiornamento in corso...
                    </span>
                  )}
                </div>
              </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
