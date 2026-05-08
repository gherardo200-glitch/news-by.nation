import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import WorldMap from "./WorldMap";
import NewsPanel from "./NewsPanel";
import { fetchNewsByCountryId } from "../../services/newsService";
import type { NewsArticle } from "../../data/mockNews";
import { Lock, Star, Calendar, LogOut, Globe, MousePointerClick } from "lucide-react";
import OnboardingFlow from "../marketing/OnboardingFlow";
import { trackCustomEvent } from "../../services/metaPixel";
import { updateSEO } from "../../services/seoService";
import { useAuth } from "../../contexts/AuthContext";
import SidebarFavorites from "../layout/SidebarFavorites";
import SidebarCalendar from "../layout/SidebarCalendar";
import FinanceTicker from "./FinanceTicker";
import FinancePanel from "./FinancePanel";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function Dashboard() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  // hint shown on first map view for guests and new users
  const [showMapHint, setShowMapHint] = useState(true);

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
    setShowMapHint(false);

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
      setError("Impossibile caricare le notizie. Riprova più tardi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle calendar: close news panel if open, then toggle calendar
  const handleCalendarToggle = useCallback(() => {
    if (selectedCountry) {
      setSelectedCountry(null);
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
    setShowMapHint(false);
  }, []);

  const handleFavoriteClick = useCallback((countryId: string) => {
    handleCountryClick(countryId);
  }, [handleCountryClick]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (e) {
      console.error("Logout error:", e);
    }
  }, [navigate]);

  const isPanelOpen = !!(selectedCountry || selectedSymbol);

  return (
    <main className="w-screen h-[100dvh] overflow-hidden bg-[#050B14] relative font-sans text-white">
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      {/* Top Bar Navigation */}
      <div className="absolute top-0 left-0 w-full sm:w-[calc(100%-450px)] p-4 sm:p-6 z-40 flex items-center justify-between pointer-events-none">

        {/* Left: Watchlist toggle + Brand */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {!isGuest && currentUser && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white transition-all active:scale-95 shadow-lg backdrop-blur-md flex items-center justify-center group"
              title="Watchlist"
            >
              <Star className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 transition-colors" />
            </button>
          )}
          {/* Brand — visible on all screen sizes */}
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5">
            <Globe className="w-4 h-4 text-blue-400" />
            <h1 className="text-sm sm:text-base font-display font-extrabold tracking-tight text-white/90 select-none drop-shadow-md">
              NewsByNation <span className="text-blue-400">PRO</span>
            </h1>
          </div>
        </div>

        {/* Right: CTAs */}
        <div className="pointer-events-auto flex items-center gap-2">
          {isGuest ? (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors text-sm font-bold shadow-lg shadow-blue-500/30"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Entra o Registrati</span>
              <span className="sm:hidden">Accedi</span>
            </button>
          ) : currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-xs font-semibold backdrop-blur-md"
              title="Esci"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Esci</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Toggle (top-right) — hidden when a panel is open */}
      {!isGuest && !isPanelOpen && (
        <button
          onClick={handleCalendarToggle}
          className={`absolute top-4 sm:top-6 right-4 sm:right-6 z-40 p-3 rounded-2xl border text-white transition-all active:scale-95 shadow-lg backdrop-blur-md flex items-center justify-center group pointer-events-auto ${
            isCalendarOpen
              ? 'bg-blue-500/20 border-blue-500/50'
              : 'bg-white/5 hover:bg-white/10 border-white/10'
          }`}
          title="Calendario Economico"
        >
          <Calendar className={`w-5 h-5 transition-colors ${isCalendarOpen ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'}`} />
        </button>
      )}

      {/* Guest locked-feature hints — subtle badges on unreachable buttons */}
      {isGuest && !isPanelOpen && (
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl text-xs text-gray-500 font-medium">
            <Lock className="w-3 h-3 text-gray-600" />
            Calendario — solo account
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl text-xs text-gray-500 font-medium">
            <Lock className="w-3 h-3 text-gray-600" />
            Watchlist — solo account
          </div>
        </div>
      )}

      {/* Map exploration hint — shown until first country click */}
      {showMapHint && !isPanelOpen && !showOnboarding && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-sm text-gray-300 font-medium shadow-xl animate-pulse">
            <MousePointerClick className="w-4 h-4 text-blue-400 flex-shrink-0" />
            Clicca su un paese per leggere le notizie
          </div>
        </div>
      )}

      {/* Watchlist Sidebar (Left) */}
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

      {/* Sliding Panel (News / Finance) */}
      <div
        className={`absolute bottom-0 sm:top-0 right-0 w-full h-[88dvh] sm:h-full sm:w-[450px] z-30 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
          isPanelOpen
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

      {/* Economic Calendar Sidebar */}
      <SidebarCalendar
        isOpen={isCalendarOpen && !isPanelOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Financial Ticker (Bottom Band) */}
      <FinanceTicker onSymbolSelect={handleSymbolSelect} />
    </main>
  );
}
