export type AQIBand = {
  label: string;
  min: number;
  max: number;
  color: string;
  badgeClass: string;
};

export const EAQI_BANDS: AQIBand[] = [
  {
    label: "Good",
    min: 0,
    max: 20,
    color: "#10b981",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    label: "Fair",
    min: 20,
    max: 40,
    color: "#84cc16",
    badgeClass: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  },
  {
    label: "Moderate",
    min: 40,
    max: 60,
    color: "#eab308",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  {
    label: "Poor",
    min: 60,
    max: 80,
    color: "#f97316",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    label: "Very Poor",
    min: 80,
    max: 100,
    color: "#ef4444",
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    label: "Extremely Poor",
    min: 100,
    max: Infinity,
    color: "#a855f7",
    badgeClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
];

export function getEAQIBand(aqi: number | null): AQIBand {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return {
      label: "No data",
      min: 0,
      max: 0,
      color: "#71717a",
      badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
    };
  }
  for (const band of EAQI_BANDS) {
    if (aqi <= band.max) {
      return band;
    }
  }
  return EAQI_BANDS[EAQI_BANDS.length - 1];
}

export type PollutantLevel =
  "Good" | "Fair" | "Moderate" | "Poor" | "Very Poor";

export interface PollutantConfig {
  name: string;
  symbol: string;
  description: string;
  unit: string;
  // Thresholds defining the upper bound for Good, Fair, Moderate, Poor (above Poor is Very Poor)
  thresholds: [number, number, number, number];
  maxScale: number;
}

export const POLLUTANT_CONFIGS: Record<string, PollutantConfig> = {
  pm2_5: {
    name: "Particulate Matter 2.5",
    symbol: "PM2.5",
    description:
      "Fine inhalable particles with diameters 2.5 µm and smaller that penetrate deep into the lungs.",
    unit: "µg/m³",
    thresholds: [10, 20, 25, 50],
    maxScale: 60,
  },
  pm10: {
    name: "Particulate Matter 10",
    symbol: "PM10",
    description:
      "Inhalable particles with diameters 10 µm and smaller, such as dust, pollen, and mold.",
    unit: "µg/m³",
    thresholds: [20, 40, 50, 100],
    maxScale: 120,
  },
  o3: {
    name: "Ozone",
    symbol: "O₃",
    description:
      "Ground-level ozone formed by chemical reactions of atmospheric pollutants in sunlight.",
    unit: "µg/m³",
    thresholds: [50, 100, 130, 240],
    maxScale: 280,
  },
  no2: {
    name: "Nitrogen Dioxide",
    symbol: "NO₂",
    description:
      "Emitted primarily from road traffic combustion; causes respiratory inflammation.",
    unit: "µg/m³",
    thresholds: [40, 90, 120, 230],
    maxScale: 260,
  },
  so2: {
    name: "Sulphur Dioxide",
    symbol: "SO₂",
    description:
      "Emitted by fossil fuel combustion and industrial processes; irritates the respiratory tract.",
    unit: "µg/m³",
    thresholds: [100, 200, 350, 500],
    maxScale: 600,
  },
  co: {
    name: "Carbon Monoxide",
    symbol: "CO",
    description:
      "Colorless, odorless gas produced by incomplete combustion of fuels.",
    unit: "µg/m³",
    thresholds: [4400, 9400, 12400, 15400],
    maxScale: 18000,
  },
  nh3: {
    name: "Ammonia",
    symbol: "NH₃",
    description:
      "Sharp gas emitted mostly from agricultural livestock waste and fertilizer applications.",
    unit: "µg/m³",
    thresholds: [40, 70, 150, 200],
    maxScale: 250,
  },
};

export const LEVEL_NAMES: PollutantLevel[] = [
  "Good",
  "Fair",
  "Moderate",
  "Poor",
  "Very Poor",
];

export function getPollutantLevelIndex(
  value: number | null,
  thresholds: [number, number, number, number],
): number {
  if (value === null || isNaN(value)) return -1;
  if (value <= thresholds[0]) return 0;
  if (value <= thresholds[1]) return 1;
  if (value <= thresholds[2]) return 2;
  if (value <= thresholds[3]) return 3;
  return 4;
}

export function getPollutantLevel(
  value: number | null,
  thresholds: [number, number, number, number],
): PollutantLevel | "No data" {
  const index = getPollutantLevelIndex(value, thresholds);
  if (index === -1) return "No data";
  return LEVEL_NAMES[index];
}
