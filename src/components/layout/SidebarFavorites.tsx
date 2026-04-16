import { Globe, Star, MapPin, X, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { subscribeToFavorites, subscribeToFinanceFavorites } from '../../services/userService';

export default function SidebarFavorites({ 
  isOpen, 
  onSelectCountry, 
  onSelectSymbol,
  onClose 
}: { 
  isOpen: boolean, 
  onSelectCountry: (country: string) => void, 
  onSelectSymbol: (symbol: string) => void,
  onClose: () => void 
}) {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [financeFavorites, setFinanceFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub1 = subscribeToFavorites(currentUser.uid, (favs) => {
      setFavorites(favs);
    });
    const unsub2 = subscribeToFinanceFavorites(currentUser.uid, (favs) => {
      setFinanceFavorites(favs);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser]);

  return (
    <div className={`absolute top-0 left-0 w-[280px] h-[100dvh] glass-panel border-r border-white/10 flex flex-col z-40 bg-gray-900/50 backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Branding Section */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-b from-gray-900/80 to-transparent relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/30 border border-white/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-white leading-none">
              NewsByNation <span className="text-blue-500">PRO</span>
            </h1>
            <span className="text-[10px] text-blue-300 font-medium tracking-wide mt-0.5 truncate max-w-[120px]">{currentUser?.email}</span>
          </div>
        </div>
      </div>

      {/* Watchlist Section */}
      <div className="p-6 flex-1 flex flex-col pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500/80" />
            Watchlist
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-2">
          {favorites.length === 0 ? (
            <div className="p-6 text-center text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-sm font-medium text-gray-400">Nessuna nazione</p>
              <p className="text-xs text-gray-500 mt-1">Apri una nazione dalla mappa e clicca la stella su in alto per aggiungerla qui.</p>
            </div>
          ) : (
            favorites.map((country) => (
              <button
                key={country}
                onClick={() => onSelectCountry(country)}
                className="w-full group flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-transparent border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all duration-300 text-left"
              >
                <span className="font-bold text-gray-300 group-hover:text-white transition-colors">{country}</span>
                <MapPin className="w-4 h-4 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Financial Wishlist Section */}
      <div className="p-6 flex-1 flex flex-col pt-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400/80" />
            Financials
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-2">
          {financeFavorites.length === 0 ? (
            <div className="p-4 text-center text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">No instruments</p>
            </div>
          ) : (
            financeFavorites.map((symbol) => (
              <button
                key={symbol}
                onClick={() => onSelectSymbol(symbol)}
                className="w-full group flex items-center justify-between p-3 bg-white/[0.02] hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-transparent border border-white/5 hover:border-cyan-500/30 rounded-2xl transition-all duration-300 text-left"
              >
                <span className="font-bold text-gray-300 group-hover:text-white transition-colors">{symbol}</span>
                <TrendingUp className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
