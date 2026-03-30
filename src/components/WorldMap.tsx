import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import realNewsData from "../data/realNews.json";

// Local topojson file to bypass CORS and ad-blockers
const geoUrl = "/world-110m.json";

// Dynamically support whatever country the Python script fetched!
const SUPPORTED_COUNTRIES = Object.keys(realNewsData);

interface WorldMapProps {
  onCountryClick: (countryId: string) => void;
  selectedCountry: string | null;
}

export default function WorldMap({ onCountryClick, selectedCountry }: WorldMapProps) {
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  function handleZoomIn() {
    if (position.zoom >= 8) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }

  function handleMoveEnd(newPosition: { coordinates: [number, number], zoom: number }) {
    setPosition(newPosition);
  }

  return (
    <div className="w-full h-full bg-[#05080f] bg-grid-pattern absolute inset-0 text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Glow efffect behind map */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 130 }}
        className="w-full h-full outline-none"
      >
        <ZoomableGroup 
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1} 
          maxZoom={8}
          translateExtent={[[0, 0], [800, 600]]} // Keeps map from panning into infinity
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.name;
                const isSupported = SUPPORTED_COUNTRIES.includes(countryName);
                const isSelected = selectedCountry === countryName;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (isSupported) {
                        onCountryClick(countryName);
                      }
                    }}
                    style={{
                      default: {
                        fill: isSelected ? "#3b82f6" : isSupported ? "#1e3a8a" : "#111827",
                        stroke: isSupported ? "#60a5fa" : "#1f2937",
                        strokeWidth: isSupported ? 0.3 : 0.2,
                        outline: "none",
                        cursor: isSupported ? "pointer" : "default",
                        transition: "all 0.3s ease"
                      },
                      hover: {
                        fill: isSupported ? "#60a5fa" : "#1f2937",
                        stroke: "#93c5fd",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: isSupported ? "pointer" : "default",
                      },
                      pressed: {
                        fill: isSupported ? "#2563eb" : "#111827",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 p-3 sm:p-4 glass-panel rounded-2xl pointer-events-none max-w-[180px] sm:max-w-[240px]">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 border border-white/20">
             <span className="font-display font-black text-white text-[10px] sm:text-sm tracking-widest ml-0.5">NBN</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
              NewsByNation
            </h1>
            <span className="text-[9px] sm:text-[10px] text-blue-300 font-medium tracking-wide mt-0.5">Global Pulse</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg hidden">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">{SUPPORTED_COUNTRIES.length} Active Nations</span>
        </div>
      </div>

      {/* Manual Zoom Controls */}
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-10 flex flex-col gap-1 sm:gap-2 glass-panel p-1.5 sm:p-2 rounded-2xl">
        <button 
          onClick={handleZoomIn}
          className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white group"
        >
          <Plus className="w-5 h-5 group-active:scale-90 transition-transform" />
        </button>
        <div className="w-full h-px bg-white/10 my-0.5 sm:my-1" />
        <button 
          onClick={handleZoomOut}
          className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white group"
        >
          <Minus className="w-5 h-5 group-active:scale-90 transition-transform" />
        </button>
      </div>
    </div>
  );
}
