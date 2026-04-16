import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import WorldMap from "./WorldMap";
import NewsPanel from "./NewsPanel";
import { fetchNewsByCountryId } from "../../services/newsService";
import type { NewsArticle } from "../../data/mockNews";
import { Lock, Star, Calendar } from "lucide-react";
import OnboardingFlow from "../marketing/OnboardingFlow";
import { trackCustomEvent } from "../../services/metaPixel";
import { updateSEO } from "../../services/seoService";
import { useAuth } from "../../contexts/AuthContext";
import SidebarFavorites from "../layout/SidebarFavorites";
import SidebarCalendar from "../layout/SidebarCalendar";
import FinanceTicker from "./FinanceTicker";
import FinancePanel from "./FinancePanel";

export default function Dashboard() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = new URLSearchParams(location.search).get('guest') === 'true';
  const { currentUser } = useAuth();

  const [showOnboarding, setShowOnboarding] = useState(
    () => !isGuest && localStorage.getItem('onboarding_done') !== 'true'
  );

  useEffect(() => {
    updateSEO({
      title: "NewsByNation PRO — Intelligence Globale",
      description: "Aggregatore di notizie geopolitiche per nazione.",
    });
  }, []);

  const handleCountryClick = useCallback(async (countryId: string) => {
    setSelectedCountry(countryId);
    setNews([]);
    setIsLoading(true);
    setError(null);
    
    // Close left sidebar, calendar, and finance panel
    setIsSidebarOpen(false);
    setIsCalendarOpen(false);
    setSelectedSymbol(null);
    
    // @ts-ignore
    if (window.gtag) window.gtag('event', 'view_country', { country_id: countryId });
    trackCustomEvent('ViewCountry', { country: countryId });
    
    try {
      const fetched = await fetchNewsByCountryId(countryId);
      setNews(fetched);
    } catch (e) {
      console.error("Errore nel recupero notizie.", e);
      setError("Failed to load news. Try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle calendar: close news panel if open, then toggle calendar
  const handleCalendarToggle = useCallback(() => {
    if (selectedCountry) {
      setSelectedCountry(null); // close news panel
    }
    setIsCalendarOpen(prev => !prev);
  }, [selectedCountry]);

  const handleClosePanel = useCallback(() => {
    setSelectedCountry(null);
    setSelectedSymbol(null);
  }, []);

  const handleSymbolSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setSelectedCountry(null);
    setIsCalendarOpen(false);
    setIsSidebarOpen(false);
  }, []);

  const handleFavoriteClick = useCallback((countryId: string) => {
    handleCountryClick(countryId);
  }, [handleCountryClick]);

  return (
    <main className="w-screen h-[100dvh] overflow-hidden bg-[#050B14] relative font-sans text-white">
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      {/* Top Bar Navigation Menu */}
      <div className="absolute top-0 left-0 w-full sm:w-[calc(100%-420px)] p-6 z-40 flex items-center justify-between pointer-events-none">
        
        {/* Left Side: Brand and Sidebar toggle */}
        <div className="flex items-center gap-4 pointer-events-auto">
           {!isGuest && currentUser && (
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white transition-all active:scale-95 shadow-lg backdrop-blur-md flex items-center justify-center group"
             >
               <Star className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 transition-colors" />
             </button>
           )}
           <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-white/90 select-none hidden sm:block drop-shadow-md">
             NewsByNation <span className="text-blue-400">PRO</span>
           </h1>
        </div>

        {/* Right Side / Auth */}
        <div className="pointer-events-auto flex items-center gap-3">
          {isGuest && (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors text-sm font-bold shadow-lg shadow-blue-500/30"
            >
              <Lock className="w-4 h-4" /> Entra o Registrati
            </button>
          )}
        </div>
      </div>

      {/* Persistent Calendar Toggle Button (Absolute Top Right) — hidden when news panel is open */}
      {!isGuest && !selectedCountry && (
        <button 
          onClick={handleCalendarToggle}
          className={`absolute top-6 right-6 z-40 p-3 rounded-2xl border text-white transition-all active:scale-95 shadow-lg backdrop-blur-md flex items-center justify-center group pointer-events-auto ${
            isCalendarOpen
              ? 'bg-blue-500/20 border-blue-500/50'
              : 'bg-white/5 hover:bg-white/10 border-white/10'
          }`}
        >
          <Calendar className={`w-5 h-5 transition-colors ${isCalendarOpen ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'}`} />
        </button>
      )}

      {/* Watchlist Sidebar (Left sliding drawer) */}
      {!isGuest && currentUser && (
        <SidebarFavorites 
           isOpen={isSidebarOpen} 
           onSelectCountry={handleFavoriteClick} 
           onSelectSymbol={handleSymbolSelect}
           onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 3D Map (Full Screen Background) */}
      <div className="absolute inset-0 w-full h-full">
        <WorldMap 
          onCountryClick={handleCountryClick} 
          selectedCountry={selectedCountry}
        />
      </div>
      
      {/* Sliding News Panel Overlay — shares the right side with Calendar (mutually exclusive) */}
      <div 
        className={`absolute bottom-0 sm:top-0 right-0 w-full h-[88dvh] sm:h-full sm:w-[450px] z-30 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
          selectedCountry || selectedSymbol 
            ? "translate-y-0 sm:translate-y-0 sm:translate-x-0" 
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
      >
        <div className="h-full w-full relative sm:shadow-[-20px_0_50px_-15px_rgba(0,0,0,0.5)]">
          {selectedCountry && (
             <NewsPanel
              countryId={selectedCountry}
              news={news}
              isLoading={isLoading}
              error={error}
              onClose={handleClosePanel}
            />
          )}
          {selectedSymbol && (
            <FinancePanel 
              symbol={selectedSymbol}
              onClose={handleClosePanel}
            />
          )}
        </div>
      </div>

      {/* Economic Calendar Sidebar — mutually exclusive with NewsPanel */}
      <SidebarCalendar 
        isOpen={isCalendarOpen && !selectedCountry && !selectedSymbol} 
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Financial Ticker (Bottom Band) */}
      <FinanceTicker onSymbolSelect={handleSymbolSelect} />
    </main>
  );
}
