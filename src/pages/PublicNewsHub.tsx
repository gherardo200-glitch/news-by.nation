import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Globe, ArrowRight } from "lucide-react";
import { fetchNewsByCountryId } from "../services/newsService";
import type { NewsArticle } from "../data/mockNews";
import { updateSEO } from "../services/seoService";

export default function PublicNewsHub() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryId) return;

    // Update SEO dynamically for indexing
    updateSEO({
      title: `Notizie da ${countryId} | NewsByNation PRO`,
      description: `Ultime notizie finanziarie e geopolitiche in tempo reale da ${countryId}. Dati aggiornati e analisi di mercato su NewsByNation PRO.`,
      keywords: `notizie ${countryId}, economia ${countryId}, finanza ${countryId}, geopolitica`
    });

    const loadNews = async () => {
      try {
        const data = await fetchNewsByCountryId(countryId);
        setNews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [countryId]);

  return (
    <div className="min-h-[100dvh] bg-[#050B14] text-white font-sans flex flex-col items-center pt-10 px-4">
      <nav className="w-full max-w-3xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-lg border border-white/20">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg">NewsByNation <span className="text-blue-400">PRO</span></span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors"
        >
          Accedi
        </button>
      </nav>

      <main className="w-full max-w-3xl flex flex-col gap-6">
        <header className="mb-6">
          <h1 className="text-4xl font-display font-extrabold mb-2">Notizie Finanziarie: {countryId}</h1>
          <p className="text-gray-400">Aggiornamenti in tempo reale dai mercati e dalla politica di {countryId}.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : news.length > 0 ? (
          <div className="flex flex-col gap-4">
            {news.map((item) => (
              <article key={item.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{item.source}</span>
                  <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{item.excerpt}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-gray-400">Nessuna notizia recente trovata per {countryId}.</p>
          </div>
        )}

        <div className="mt-12 p-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/10 border border-blue-500/20 rounded-3xl text-center flex flex-col items-center">
          <h3 className="text-xl font-bold mb-3">Vuoi esplorare 177 nazioni sulla mappa 3D?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md">NewsByNation PRO è il terminale gratuito per l'intelligence di mercato e geopolitica globale.</p>
          <button 
            onClick={() => navigate('/app?guest=true')}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            Esplora il Terminale <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-white/5 w-full text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} NewsByNation PRO. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}
