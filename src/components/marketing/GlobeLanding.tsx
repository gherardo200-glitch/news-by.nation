import { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe as GlobeIcon, ShieldAlert, BarChart2, Lock, Video, Layers } from 'lucide-react';

/* ─── stessa lista feature della landing originale ─── */
const FEATURES = [
  { icon: GlobeIcon,    color: 'from-blue-500 to-blue-600',      shadow: 'shadow-blue-500/30',   title: 'Mappa Interattiva 3D',  desc: 'Esplora il globo in 3D con dati live. Naviga con zoom tattico e tieni traccia degli hot-spot geopolitici.' },
  { icon: Layers,       color: 'from-cyan-500 to-cyan-600',       shadow: 'shadow-cyan-500/30',    title: 'Filtri Tattici',         desc: 'Attiva e disattiva i layer per conflitti, cyber, infrastrutture critiche o basi militari.' },
  { icon: ShieldAlert,  color: 'from-indigo-500 to-purple-600',   shadow: 'shadow-indigo-500/30',  title: 'Sistema DEFCON',         desc: 'Indicatori di stato live che segnalano tensioni globali tramite feed di sicurezza aggregati.' },
  { icon: BarChart2,    color: 'from-emerald-500 to-teal-600',    shadow: 'shadow-emerald-500/30', title: 'Bento-Grid Analitica',   desc: 'Cruscotto operativo per macro-regioni, progettato per il colpo d\'occhio immediato.' },
  { icon: Video,        color: 'from-amber-500 to-orange-500',    shadow: 'shadow-amber-500/30',   title: 'Surveillance Hub',       desc: 'Webcam live da Teheran, Tel Aviv, Kiev racchiuse in una griglia di monitoraggio tattico.' },
  { icon: Lock,         color: 'from-rose-500 to-pink-600',       shadow: 'shadow-rose-500/30',    title: 'Profilo Cloud Sicuro',   desc: 'Autenticazione Firebase per salvare le tue Watchlist in sicurezza su tutti i dispositivi.' },
];

const STATS = [
  { value: '177+', label: 'Nazioni Monitorate' },
  { value: '15min', label: 'Frequenza Aggiornamento' },
  { value: '100%', label: 'Open Source & Gratuito' },
  { value: '0€', label: 'Costo di Accesso' },
];

export default function GlobeLanding() {
  const navigate = useNavigate();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [countries, setCountries] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const scrollP = useRef(0);
  const raf = useRef(0);
  const lng = useRef(0);   // longitudine corrente (smooth)

  /* carica paesi GeoJSON */
  useEffect(() => {
    fetch('/world.geojson').then(r => r.json())
      .then(d => setCountries(d.features || []))
      .catch(console.error);
  }, []);

  /* init globo */
  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const ctrl = globeRef.current.controls();
    if (ctrl) {
      ctrl.autoRotate    = false;
      ctrl.enableZoom    = false;
      ctrl.enableRotate  = false;
      ctrl.enablePan     = false;
    }
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);
  }, [ready]);

  /* scroll → rotazione sincronizzata */
  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scrollP.current = Math.max(0, Math.min(1, window.scrollY / max));
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = () => {
      if (globeRef.current && ready) {
        const target = scrollP.current * 200;          // 0 → 200° di longitudine
        lng.current += (target - lng.current) * 0.08;  // smooth follow
        globeRef.current.pointOfView(
          { lat: 20, lng: lng.current, altitude: 2.2 },
          0
        );
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [ready]);

  const handleGuest = () => navigate('/app?guest=true');

  return (
    <div className="relative w-full min-h-screen bg-[#050B14] text-white font-sans overflow-x-hidden">

      {/* ── GLOBO FISSO NELLO SFONDO ── */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <Globe
          ref={globeRef as any}
          width={typeof window !== 'undefined' ? window.innerWidth : 1440}
          height={typeof window !== 'undefined' ? window.innerHeight : 900}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          polygonsData={countries}
          polygonCapColor={() => 'rgba(30,58,138,0.35)'}
          polygonSideColor={() => 'rgba(0,0,0,0)'}
          polygonStrokeColor={() => 'rgba(59,130,246,0.25)'}
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.18}
          onGlobeReady={() => setReady(true)}
        />
      </div>

      {/* velo scuro sopra il globo così i testi si leggono */}
      <div className="fixed inset-0 z-[1] bg-[#050B14]/55 pointer-events-none" />

      {/* ── CONTENUTO (scroll normale sopra il globo) ── */}
      <div className="relative z-10">

        {/* NAV */}
        <nav className="w-full px-6 py-4 flex items-center justify-between
          border-b border-white/5 bg-[#050B14]/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl
              flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
              <GlobeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              NewsByNation <span className="text-blue-400">PRO</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Accedi
            </button>
            <button onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500
                rounded-full transition-all shadow-lg shadow-blue-600/30">
              Inizia Gratis →
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="flex flex-col items-center text-center px-4 pt-36 pb-32 w-full max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-blue-500/10 border border-blue-500/20 text-blue-300
            text-xs font-bold tracking-widest uppercase mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"/>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"/>
            </span>
            Live · Aggiornato ogni 15 minuti
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">
            Il Terminale di
            <span className="block text-transparent bg-clip-text
              bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              Intelligence Globale.
            </span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed font-light">
            Notizie finanziarie e geopolitiche aggregate da 177 nazioni, calendario macroeconomico
            integrato e mappa interattiva in tempo reale.{' '}
            <strong className="text-gray-200 font-semibold">Tutto gratis. Senza algoritmi pubblicitari.</strong>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
            <button onClick={() => navigate('/login')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500
                hover:from-blue-500 hover:to-cyan-400 rounded-2xl font-bold text-lg
                shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all
                flex items-center gap-3 hover:scale-105 active:scale-95">
              Accedi <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={handleGuest}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10
                rounded-2xl font-bold text-lg text-white transition-all
                flex items-center gap-3 hover:scale-105 active:scale-95">
              Esplora come Ospite
            </button>
          </div>

          {/* social proof */}
          <div className="mt-8 flex items-center gap-4 text-sm text-gray-400">
            <div className="flex -space-x-2">
              {[['bg-blue-500/30','text-blue-300','A'],['bg-emerald-500/30','text-emerald-300','M'],
                ['bg-purple-500/30','text-purple-300','S'],['bg-amber-500/30','text-amber-300','R']
              ].map(([bg, txt, l]) => (
                <div key={l} className={`w-8 h-8 rounded-full border-2 border-[#050B14] ${bg} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${txt}`}>{l}</span>
                </div>
              ))}
            </div>
            <p>Unisciti a <strong>+1.200 analisti</strong> in tutto il mondo.</p>
          </div>
        </section>

        {/* STATS */}
        <section className="w-full max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className="p-5 bg-white/[.02] border border-white/5 rounded-2xl text-center">
                <p className="text-3xl font-extrabold text-transparent bg-clip-text
                  bg-gradient-to-r from-blue-400 to-cyan-300">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Tutto ciò di cui hai bisogno per{' '}
              <span className="text-blue-400">dominare i mercati</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Uno strumento professionale costruito per investitori, trader, analisti
              e chiunque voglia capire il mondo attraverso la lente dell'economia.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className="group p-7 bg-white/[.02] hover:bg-white/[.04]
                    border border-white/5 hover:border-blue-500/20
                    rounded-[1.75rem] transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-2xl
                    flex items-center justify-center mb-5 shadow-lg ${f.shadow}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-200 transition-colors">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full max-w-4xl mx-auto px-4 pb-28 text-center">
          <div className="p-12 bg-gradient-to-br from-blue-900/30 via-[#050B14] to-cyan-900/10
            border border-blue-500/15 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2
              w-[400px] h-[200px] bg-blue-500/10 blur-[80px] pointer-events-none"/>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 relative z-10">
              Pronti a saltare<br />nel{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                futuro dell'analisi?
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto relative z-10">
              Unisciti a chi già usa NewsByNation PRO per leggere il mondo prima degli altri.
              Accesso gratuito. Nessuna carta di credito.
            </p>
            <button onClick={handleGuest}
              className="relative z-10 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500
                hover:from-blue-500 hover:to-cyan-400 rounded-2xl font-bold text-lg
                shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all hover:scale-105 active:scale-95">
              Esplora come Ospite →
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-10 px-6 text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GlobeIcon className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-gray-400">NewsByNation PRO</span>
          </div>
          <p>Aggregatore di notizie finanziarie, analisi geopolitica globale, calendario macroeconomico in tempo reale.</p>
          <p className="mt-6 text-xs font-medium">© {new Date().getFullYear()} NewsByNation PRO</p>
        </footer>

      </div>{/* /z-10 content */}
    </div>
  );
}
