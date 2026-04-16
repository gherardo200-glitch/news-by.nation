import { memo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function SidebarCalendar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "colorTheme": "dark",
        "isTransparent": true,
        "width": "100%",
        "height": "100%",
        "locale": "it",
        "importanceFilter": "-1,0,1",
        "currencyFilter": "USD,EUR,GBP,JPY,AUD,CAD,CHF,CNY"
      }`;
      
    container.current.appendChild(script);
    
    return () => {
      if (container.current) container.current.innerHTML = '';
    }
  }, []);

  return (
    <div className={`absolute top-0 right-0 w-[340px] h-[100dvh] glass-panel border-l border-white/10 flex flex-col z-30 bg-gray-900/50 backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 border-b border-white/5 bg-gray-900/30 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 pr-8">
          Calendario Economico
        </h2>
        <p className="text-xs text-gray-500 font-medium tracking-wide mt-1">Eventi Macro Globali</p>
      </div>
      <div className="flex-1 w-full h-full overflow-hidden" ref={container} />
    </div>
  );
}

export default memo(SidebarCalendar);
