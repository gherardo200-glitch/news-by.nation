import React from 'react';
import { Settings, Info } from 'lucide-react';

interface TacticalPanelProps {
  title: string;
  children: React.ReactNode;
  alertLevel?: 'normal' | 'caution' | 'alert' | 'live';
  className?: string;
  headerRight?: React.ReactNode;
}

export default function TacticalPanel({ title, children, alertLevel = 'normal', className = '', headerRight }: TacticalPanelProps) {
  const getAlertTag = () => {
    switch(alertLevel) {
      case 'caution': return <span className="bg-tactical-caution/20 text-tactical-caution text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-tactical-caution/30 animate-pulse">Caution</span>;
      case 'alert': return <span className="bg-tactical-alert/20 text-tactical-alert text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-tactical-alert/30 animate-pulse">Alert</span>;
      case 'live': return <span className="text-tactical-neon text-[10px] uppercase font-bold px-1.5 py-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-tactical-neon rounded-full animate-ping mr-1"></span>Live</span>;
      default: return null;
    }
  };

  return (
    <div className={`tactical-panel scanline flex flex-col ${className}`}>
      {/* Tactical Shimmer Effect */}
      <div className="tactical-border-shimmer"></div>
      
      {/* Panel Header */}
      <div className="h-8 border-b border-tactical-border/50 bg-tactical-bg/50 px-3 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">{title}</h3>
          {getAlertTag()}
        </div>
        <div className="flex items-center gap-2 opacity-50">
          {headerRight}
          <Info className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
          <Settings className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
        </div>
      </div>
      
      {/* Panel Content (Scrollable if needed) */}
      <div className="flex-1 overflow-auto p-3 relative scrollbar-hide">
        {children}
      </div>
      
      {/* Tactical Corner Accents */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-tactical-neon/50"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-tactical-neon/50"></div>
    </div>
  );
}
