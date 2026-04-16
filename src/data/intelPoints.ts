export interface IntelPoint {
  id: string;
  lat: number;
  lng: number;
  type: 'conflict' | 'base' | 'cyber' | 'infrastructure' | 'intel';
  name: string;
  status: 'active' | 'monitoring' | 'resolved';
  severity: number; // 1-10
}

function generateRandomPoints(count: number, baseLat: number, baseLng: number, spread: number, type: IntelPoint['type'], names: string[]): IntelPoint[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${type}-${Date.now()}-${Math.random()}`,
    lat: baseLat + (Math.random() - 0.5) * spread,
    lng: baseLng + (Math.random() - 0.5) * spread,
    type,
    name: names[i % names.length],
    status: Math.random() > 0.3 ? 'active' : 'monitoring',
    severity: Math.floor(Math.random() * 5) + 5
  }));
}

// Generate some mock distribution across the globe
export const intelPoints: IntelPoint[] = [
  ...generateRandomPoints(30, 31.5, 34.8, 10, 'conflict', ['Border Skirmish', 'Artillery Fire', 'Air Strike', 'Naval Incident']), // Middle East
  ...generateRandomPoints(40, 48.3, 31.1, 15, 'conflict', ['Frontline Clash', 'Drone Attack', 'Missile Strike', 'Troop Movement']), // Eastern Europe
  ...generateRandomPoints(15, 25.0, 121.5, 8, 'intel', ['Signal Intercept', 'Naval Drill', 'Airspace Violation', 'Cyber Intrusions']), // Taiwan Strait
  ...generateRandomPoints(20, 12.0, -15.0, 20, 'conflict', ['Insurgent Activity', 'Camp Raid', 'Supply Disruption']), // Sahel/Africa
  ...generateRandomPoints(50, 39.0, -98.0, 40, 'base', ['Military Installation', 'Command Center', 'Air Force Base', 'Naval Station']), // US
  ...generateRandomPoints(40, 55.0, 60.0, 50, 'base', ['Radar Station', 'Testing Ground', 'Storage Facility']), // Russia
  ...generateRandomPoints(50, 35.0, 105.0, 30, 'base', ['Command Post', 'Rocket Force', 'Naval Base']), // China
  ...generateRandomPoints(100, 20.0, 0.0, 120, 'cyber', ['DDoS Attack', 'Data Breach', 'Ransomware', 'APT Campaign']), // Global Cyber
  ...generateRandomPoints(80, 20.0, 0.0, 140, 'infrastructure', ['Subsea Cable', 'Oil Pipeline', 'Gas Terminal', 'Power Grid']), // Global Infrastructure
];
