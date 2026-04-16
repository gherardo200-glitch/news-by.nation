import { useState, useEffect } from 'react';
import { Globe, Map, Star, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    icon: Globe,
    color: 'from-blue-500 to-cyan-500',
    glow: 'bg-blue-500/20',
    tag: '01 — Globo 3D',
    title: 'Esplora il Pianeta in\u00a03D Render',
    desc: 'Abbiamo trasformato la mappa in un globo interattivo. Clicca e trascina per ruotare il pianeta. Se una nazione è illuminata, abbiamo intelligence geopolitica pronta per te. Su mobile usa il tocco singolo per ruotare.',
    tip: '💡 Trascina per esplorare, usa la rotella per lo zoom profondo.'
  },
  {
    icon: Star,
    color: 'from-amber-500 to-yellow-400',
    glow: 'bg-amber-500/20',
    tag: '02 — Watchlist',
    title: 'Salva le Nazioni\u00a0Preferite',
    desc: 'Apri una nazione, clicca la ⭐ accanto al nome: verrà salvata nella tua Watchlist personale (barra sinistra su desktop). Le preferenze sono sincronizzate nel cloud su tutti i tuoi dispositivi.',
    tip: '💡 Puoi aggiungere fino a 50 nazioni alla tua Watchlist.'
  },
  {
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-400',
    glow: 'bg-emerald-500/20',
    tag: '03 — Calendario',
    title: 'Segui i Mercati\u00a0Globali',
    desc: 'Il pannello destro ospita il Calendario Macroeconomico live: qui trovi tutti gli eventi sensibili ai mercati — decisioni sui tassi, PIL, inflazione — organizzati cronologicamente.',
    tip: '💡 Clicca l\'icona 📅 in alto per nascondere o mostrare il calendario.'
  },
  {
    icon: Map,
    color: 'from-indigo-500 to-purple-500',
    glow: 'bg-indigo-500/20',
    tag: '04 — Visuali Notturne',
    title: 'Intelligence\u00a0H24',
    desc: 'Il terminale utilizza visuali satellitari notturne per monitorare i flussi di dati globali. I pulsanti ☰ e 📅 controllano lo spazio di lavoro: chiudi le barre per immergerti completamente nel globo 3D.',
    tip: '💡 Il globo mostra l\'atmosfera e le luci notturne della terra.'
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Preload next step icon for snappy feel
  useEffect(() => {
    setExiting(false);
  }, [step]);

  const handleNext = () => {
    if (isLast) {
      completeTour();
    } else {
      setExiting(true);
      setTimeout(() => setStep(s => s + 1), 200);
    }
  };

  const completeTour = () => {
    localStorage.setItem('onboarding_done', 'true');
    onComplete();
  };

  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050B14]/95 backdrop-blur-xl flex items-center justify-center p-4">
      {/* Background glow accent */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${current.glow} blur-[120px] rounded-full`} />
      </div>

      <div className={`relative z-10 w-full max-w-lg transition-all duration-200 ${exiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          {/* Tag */}
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            {current.tag}
          </span>

          {/* Icon */}
          <div className={`mt-6 mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white leading-tight mb-3">
            {current.title}
          </h2>
          <p className="text-gray-400 leading-relaxed mb-4 text-sm md:text-base">
            {current.desc}
          </p>
          <p className="text-xs text-gray-500 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
            {current.tip}
          </p>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={completeTour}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Salta intro
            </button>
            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm bg-gradient-to-r ${current.color} text-white shadow-lg transition-all hover:scale-105 active:scale-95`}
            >
              {isLast ? (
                <><Globe className="w-4 h-4" /> Apri il Terminale</>
              ) : (
                <>Avanti <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setExiting(true); setTimeout(() => setStep(i), 200); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-400' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skip entirely */}
      <button
        onClick={completeTour}
        className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1"
      >
        Salta <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
