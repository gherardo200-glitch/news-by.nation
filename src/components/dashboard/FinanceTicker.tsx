import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { fetchFinanceQuotes, DEFAULT_FINANCE_SYMBOLS, type FinanceData } from '../../services/financeService';

interface FinanceTickerProps {
  onSymbolSelect: (symbol: string) => void;
}

export default function FinanceTicker({ onSymbolSelect }: FinanceTickerProps) {
  const [data, setData] = useState<FinanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const symbols = DEFAULT_FINANCE_SYMBOLS.map(s => s.symbol);
    
    const loadData = async () => {
      const quotes = await fetchFinanceQuotes(symbols);
      // Duplicate data for seamless loop if needed, but for a simple ticker we can just map
      setData(quotes);
      setIsLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (isLoading && data.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 w-full h-10 bg-[#050B14]/80 backdrop-blur-md border-t border-white/10 flex items-center justify-center text-xs text-white/50 z-50">
        <Activity className="w-3 h-3 animate-pulse mr-2" />
        Caricamento dati finanziari...
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full h-11 bg-[#050B14]/80 backdrop-blur-xl border-t border-white/10 z-50 overflow-hidden flex items-center group">
      {/* Label/Header for the ticker */}
      <div className="h-full px-4 bg-blue-600/20 flex items-center gap-2 border-r border-white/10 z-10 relative">
         <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Real-Time</span>
      </div>

      {/* The Ticker Content */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div 
          className="flex items-center whitespace-nowrap h-full animate-ticker hover:[animation-play-state:paused]"
          style={{ animationDuration: '40s' }}
        >
          {/* We repeat the items to ensure a seamless scroll effect */}
          {[...data, ...data, ...data].map((item, index) => (
            <button
              key={`${item.symbol}-${index}`}
              onClick={() => onSymbolSelect(item.symbol)}
              className="inline-flex items-center px-6 py-1 hover:bg-white/5 transition-colors group/item"
            >
              <span className="text-[11px] font-bold text-white/90 mr-2 group-hover/item:text-blue-400 transition-colors uppercase">
                {item.symbol}
              </span>
              <span className="text-xs font-medium text-white/70 mr-3">
                {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
              <span className={`inline-flex items-center text-[10px] font-bold ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(item.changePercent).toFixed(2)}%
              </span>
              <div className="w-[1px] h-3 bg-white/10 ml-6" />
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-ticker {
          animation: ticker linear infinite;
        }
      `}</style>
    </div>
  );
}
