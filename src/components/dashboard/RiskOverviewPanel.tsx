import TacticalPanel from './TacticalPanel';
import { Activity } from 'lucide-react';

export default function RiskOverviewPanel() {
  const riskScore = 68; // Mock value
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <TacticalPanel title="Strategic Risk Overview" alertLevel="caution" className="h-full">
      <div className="flex items-center justify-between h-full px-4">
        {/* Risk Dial */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#f59e0b"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-display font-medium text-white">{riskScore}</span>
            <span className="text-[9px] uppercase font-bold text-tactical-caution tracking-widest mt-0.5">Elevated</span>
          </div>
        </div>

        {/* Risk Stats */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Trend</span>
              <span className="text-xs text-white font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500"></span> Unstable
              </span>
            </div>
          </div>
          
          <div className="h-px w-full bg-white/5"></div>
          
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-mono">MIL</span>
              <span className="text-xs font-mono text-tactical-alert">84</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-mono">POL</span>
              <span className="text-xs font-mono text-tactical-caution">62</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-mono">ECO</span>
              <span className="text-xs font-mono text-tactical-neon">41</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-3 text-[8px] font-mono text-gray-600">
        UPDATED: {new Date().toISOString().substring(11,16)}Z
      </div>
    </TacticalPanel>
  );
}
