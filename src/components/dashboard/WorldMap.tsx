import { useState, useEffect, useRef, useCallback } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import { Plus, Minus } from "lucide-react";
import realNewsData from "../../data/realNews.json";
import { trackCustomEvent } from "../../services/metaPixel";

// Financial-asset keys also live in realNews.json — filter them out so the map
// only treats actual countries as "supported".
const FINANCIAL_KEYS = new Set(["XAU/USD", "WTI/USD", "SPX", "IXIC", "BTC/USD", "EUR/USD"]);
const SUPPORTED_COUNTRIES = Object.keys(realNewsData).filter((k) => !FINANCIAL_KEYS.has(k));

interface WorldMapProps {
  onCountryClick: (countryId: string) => void;
  selectedCountry: string | null;
}

export default function WorldMap({ onCountryClick, selectedCountry }: WorldMapProps) {
  const globeRef = useRef<GlobeMethods>();
  const [countries, setCountries] = useState<any[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Caricamento GeoJSON
  useEffect(() => {
    fetch("/world.geojson")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.features || []);
      })
      .catch(err => {
        console.error("Error loading GeoJSON", err);
      });
  }, []);

  // Zoom manuale
  const handleZoomIn = () => {
    if (globeRef.current) {
      const currentPoint = globeRef.current.pointOfView();
      globeRef.current.pointOfView({ ...currentPoint, altitude: currentPoint.altitude * 0.7 }, 500);
    }
  };

  const handleZoomOut = () => {
    if (globeRef.current) {
      const currentPoint = globeRef.current.pointOfView();
      globeRef.current.pointOfView({ ...currentPoint, altitude: currentPoint.altitude * 1.5 }, 500);
    }
  };

  // Logica colori poligoni
  const getPolygonColor = useCallback((d: any) => {
    const name = d.properties.NAME || d.properties.name;
    const isSelected = selectedCountry === name;
    const isSupported = SUPPORTED_COUNTRIES.includes(name);

    if (isSelected) return "#3b82f6"; // Blue 500
    if (hoveredCountry === name && isSupported) return "#60a5fa"; // Blue 400 on hover
    if (isSupported) return "rgba(30, 58, 138, 0.4)"; // Subtle blue for supported
    return "rgba(5, 8, 15, 0.8)"; // Very dark for unsupported
  }, [selectedCountry, hoveredCountry]);

  const getPolygonStroke = useCallback((d: any) => {
    const name = d.properties.NAME || d.properties.name;
    return SUPPORTED_COUNTRIES.includes(name) ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.05)";
  }, []);



  return (
    <div className="w-full h-full bg-[#030508] absolute inset-0 text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-40 pointer-events-none" />

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        
        polygonsData={countries}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => "rgba(0, 0, 0, 0)"}
        polygonStrokeColor={getPolygonStroke}
        polygonLabel={(d: any) => `
          <div class="px-3 py-2 bg-gray-950/90 border border-white/10 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none">
            <p class="text-xs font-mono font-bold text-white mb-0.5">${d.properties.NAME || d.properties.name}</p>
            ${SUPPORTED_COUNTRIES.includes(d.properties.NAME || d.properties.name) 
              ? '<p class="text-[10px] text-blue-400 font-mono tracking-tighter uppercase">Live Sync Active</p>' 
              : '<p class="text-[10px] text-gray-500 font-mono italic">No telemetry</p>'}
          </div>
        `}
        onPolygonClick={(d: any) => {
          const name = d.properties.NAME || d.properties.name;
          if (SUPPORTED_COUNTRIES.includes(name)) {
            onCountryClick(name);
            // @ts-ignore
            if (window.gtag) window.gtag('event', 'view_country', { country_id: name });
            trackCustomEvent('ViewCountry', { country: name });
          }
        }}
        onPolygonHover={(d: any) => {
          setHoveredCountry(d ? (d.properties.NAME || d.properties.name) : null);
        }}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
      />

      {/* Manual Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 bg-black/60 border border-white/10 p-1 backdrop-blur-md">
        <button 
          onClick={handleZoomIn}
          className="p-1.5 bg-white/5 hover:bg-white/15 transition-colors text-gray-300 hover:text-white group"
        >
          <Plus className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
        </button>
        <div className="w-full h-px bg-white/10" />
        <button 
          onClick={handleZoomOut}
          className="p-1.5 bg-white/5 hover:bg-white/15 transition-colors text-gray-300 hover:text-white group"
        >
          <Minus className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
        </button>
      </div>
    </div>
  );
}
