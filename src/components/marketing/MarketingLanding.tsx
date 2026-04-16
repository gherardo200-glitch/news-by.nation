import { ArrowRight, Globe, ShieldAlert, BarChart2, Lock, Clock, Users, Video, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchNewsByCountryId } from '../../services/newsService';
import type { NewsArticle } from '../../data/mockNews';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

const FEATURES = [
  {
    icon: Globe,
    color: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
    title: 'Mappa Interattiva 3D',
    desc: 'Esplora il globo in 3D con dati live. Naviga con zoom tattico e tieni traccia degli hot-spot geopolitici grazie a indicatori pulsanti in tempo reale.'
  },
  {
    icon: Layers,
    color: 'from-cyan-500 to-cyan-600',
    shadow: 'shadow-cyan-500/30',
    title: 'Filtri Tattici',
    desc: 'Attiva e disattiva i Layer della mappa per focalizzarti su aree di conflitto, operazioni cyber, infrastrutture critiche o basi militari.'
  },
  {
    icon: ShieldAlert,
    color: 'from-indigo-500 to-purple-600',
    shadow: 'shadow-indigo-500/30',
    title: 'Sistema DEFCON',
    desc: 'Indicatori di stato live che segnalano tensioni globali ed elaborano la postura strategica geopolitica tramite feed di sicurezza aggregati.'
  },
  {
    icon: BarChart2,
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/30',
    title: 'Bento-Grid Analitica',
    desc: 'Un cruscotto operativo denso di informazioni suddiviso per macro-regioni, progettato per offrirti colpo d\'occhio immediato su tutto il pianeta.'
  },
  {
    icon: Video,
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/30',
    title: 'Surveillance Hub',
    desc: 'Accesso contemporaneo a molteplici webcam live (es. Teheran, Tel Aviv, Kiev) racchiuse in una griglia di monitoraggio tattico.'
  },
  {
    icon: Lock,
    color: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/30',
    title: 'Profilo Cloud Sicuro',
    desc: 'Autenticazione Firebase garantita per salvare le tue Watchlist in completa sicurezza e sincronizzarle su tutti i tuoi dispositivi.'
  }
];

const STATS = [
  { value: '177+', label: 'Nazioni Monitorate' },
  { value: '15min', label: 'Frequenza Aggiornamento' },
  { value: '100%', label: 'Focalizzato su Finanza'},
  { value: '0€', label: 'Costo di Accesso' }
];

export default function MarketingLanding() {
  const navigate = useNavigate();
  const [liveNews, setLiveNews] = useState<NewsArticle[]>([]);

  const handleGuestExploration = async () => {
    // Forziamo il logout per garantire che la guest mode sia un vero sandbox
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    navigate('/app?guest=true');
  };

  useEffect(() => {
    const loadRealNews = async () => {
      try {
        const news = await fetchNewsByCountryId("United States of America");
        setLiveNews(news.slice(0, 2));
      } catch (e) {
        console.error(e);
      }
    };
    loadRealNews();
  }, []);

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#050B14] text-white flex flex-col font-sans overflow-x-hidden">
      {/* SEO Hidden Structured Content for AEO/LLMs */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "NewsByNation PRO",
        "url": "https://newsbynation.web.app",
        "description": "Terminale di intelligence finanziaria e geopolitica globale. Monitoraggio notizie economiche, calendario macroeconomico, mappa interattiva di 177 nazioni.",
        "applicationCategory": "FinanceApplication",
        "keywords": "notizie finanziarie, geopolitica, analisi macroeconomica, banche centrali, calendario economico, mercati emergenti, notizie economia mondo, intelligence finanziaria",
        "author": { "@type": "Organization", "name": "NewsByNation PRO" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }
      })}} />

      {/* Background Radial & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC4xIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Sticky Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#050B14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/30 border border-white/20">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight">NewsByNation <span className="text-blue-400">PRO</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="hidden sm:block px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Accedi
          </button>
          <button onClick={() => navigate('/login')} className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-600/30">
            Inizia Gratis →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-20 w-full max-w-5xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold tracking-widest uppercase mb-8">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          Live · Aggiornato ogni 15 minuti
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.05] max-w-4xl">
          Il Terminale di 
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 animate-[pulse_4s_ease-in-out_infinite]"> Intelligence Globale.</span>
        </h1>

        <p className="mt-7 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed font-light">
          Notizie finanziarie e geopolitiche aggregate da 177 nazioni, calendario macroeconomico integrato e mappa interattiva in tempo reale. 
          <strong className="text-gray-200 font-semibold"> Tutto gratis. Senza algoritmi pubblicitari.</strong>
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all flex items-center gap-3 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Accedi <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleGuestExploration}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg text-white transition-all flex items-center gap-3 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Esplora come Ospite
          </button>
        </div>

        {/* Social Proof */}
        <div className="mt-8 flex items-center gap-4 text-sm text-gray-400">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#050B14] bg-blue-500/20 backdrop-blur-md flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <img className="w-8 h-8 rounded-full border-2 border-[#050B14]" src="https://i.pravatar.cc/100?img=11" alt="User" />
            <img className="w-8 h-8 rounded-full border-2 border-[#050B14]" src="https://i.pravatar.cc/100?img=33" alt="User" />
            <img className="w-8 h-8 rounded-full border-2 border-[#050B14]" src="https://i.pravatar.cc/100?img=44" alt="User" />
          </div>
          <p>Unisciti a <strong>+1.200 analisti</strong> in tutto il mondo.</p>
        </div>

        {/* Live News Preview (CRO) */}
        <div className="mt-16 w-full max-w-3xl text-left">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Live Breaking News</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveNews.length > 0 ? (
              liveNews.map((news) => (
                <div key={news.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <span className="font-semibold text-blue-400">{news.source}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Oggi</span>
                  </div>
                  <h4 className="font-bold text-white mb-2 leading-tight">{news.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">{news.excerpt}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-5 flex items-center justify-center text-gray-500 text-sm">
                Caricamento breaking news...
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-20 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div key={stat.value} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
              <p className="text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold">Tutto ciò di cui hai bisogno per <span className="text-blue-400">dominare i mercati</span></h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">Uno strumento professionale costruito per investitori, trader, analisti e chiunque voglia capire il mondo attraverso la lente dell'economia.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="group p-7 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/20 rounded-[1.75rem] transition-all duration-300 cursor-default">
                <div className={`w-12 h-12 bg-gradient-to-br ${feat.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg ${feat.shadow}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-blue-200 transition-colors">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-28 text-center">
        <div className="p-12 bg-gradient-to-br from-blue-900/30 via-[#050B14] to-cyan-900/10 border border-blue-500/15 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/10 blur-[80px] pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-4 relative z-10">
            Pronti a saltare<br />nel <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">futuro dell'analisi?</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto relative z-10">Unisciti a chi già usa NewsByNation PRO per leggere il mondo prima degli altri. Accesso gratuito. Nessuna carta di credito.</p>
          <button 
            onClick={handleGuestExploration}
            className="relative z-10 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            Esplora come Ospite →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 pt-12 pb-8 px-6 text-center text-sm text-gray-600">
        <div className="flex flex-col items-center justify-center gap-6 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-gray-400">NewsByNation PRO</span>
          </div>
          <p>Aggregatore di notizie finanziarie, analisi geopolitica globale, calendario macroeconomico in tempo reale.</p>
          
          {/* SEO Internal Links to help crawler discover /news/:countryId */}
          <div className="mt-4 pt-6 border-t border-white/5 w-full">
            <p className="text-gray-500 font-bold mb-3 text-xs uppercase tracking-widest">Esplora Notizie per Nazione</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <a href="/news/United States of America" className="hover:text-blue-400 transition-colors">Stati Uniti</a>
              <span>·</span>
              <a href="/news/Italy" className="hover:text-blue-400 transition-colors">Italia</a>
              <span>·</span>
              <a href="/news/China" className="hover:text-blue-400 transition-colors">Cina</a>
              <span>·</span>
              <a href="/news/Brazil" className="hover:text-blue-400 transition-colors">Brasile</a>
              <span>·</span>
              <a href="/news/South Africa" className="hover:text-blue-400 transition-colors">Sud Africa</a>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs font-medium">© {new Date().getFullYear()} NewsByNation PRO · Intelligence per investitori e analisti globali</p>
      </footer>
    </div>
  );
}
