import { useState, useCallback } from "react";
import WorldMap from "./components/WorldMap";
import NewsPanel from "./components/NewsPanel";
import { fetchNewsByCountryId } from "./services/newsService";
import type { NewsArticle } from "./data/mockNews";

function App() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When a country is clicked on the map
  const handleCountryClick = useCallback(async (countryId: string) => {
    setSelectedCountry(countryId);
    setNews([]);
    setIsLoading(true);
    setError(null);

    try {
      // Call our isolated service layer (which uses mock data now, Firebase later)
      const fetchedNews = await fetchNewsByCountryId(countryId);
      
      if (fetchedNews.length === 0) {
        setNews([]);
      } else {
        setNews(fetchedNews);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("Si è verificato un errore durante il recupero delle notizie.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClosePanel = () => {
    setSelectedCountry(null);
  };

  return (
    <main className="w-full h-[100dvh] overflow-hidden relative bg-[#050B14] font-sans">
      <WorldMap
        onCountryClick={handleCountryClick}
        selectedCountry={selectedCountry}
      />
      
      {/* Sliding News Panel Overlay */}
      <div 
        className={`absolute bottom-0 sm:top-0 right-0 w-full h-[88dvh] sm:h-full sm:w-[420px] z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
          selectedCountry 
            ? "translate-y-0 sm:translate-y-0 sm:translate-x-0" 
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
      >
        <div className="h-full w-full relative shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.8)] sm:shadow-2xl">
          {/* We only render the contents inside if open or transitioning to close. 
              The layout is handled inside NewsPanel. */}
          {selectedCountry && (
            <NewsPanel
              countryId={selectedCountry}
              news={news}
              isLoading={isLoading}
              error={error}
              onClose={handleClosePanel}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
