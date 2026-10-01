import { useAirQuality } from "../hooks/useAirQuality";
import type { Coords } from "../types";
import { getEAQIBand, POLLUTANT_CONFIGS, getPollutantLevelIndex } from "../constants/airQuality";
import { Wind, Info } from "lucide-react";

interface Props {
  coords: Coords;
  className?: string;
  isTabletGrid?: boolean;
}

export default function AirQualityPanel({ coords, className = "", isTabletGrid = false }: Props) {
  const { data, isLoading, isError } = useAirQuality(coords);

  if (isLoading) {
    return (
      <div className={`p-5 rounded-xl bg-card border border-border/60 shadow-md animate-pulse ${className}`}>
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-24 bg-muted rounded-xl mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`p-5 rounded-xl bg-card border border-border/60 shadow-md ${className}`}>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
          <Wind className="w-5 h-5 text-sky-400" aria-hidden="true" />
          Air Pollution
        </h2>
        <p className="text-sm text-muted-foreground">Air quality data is currently unavailable for this location.</p>
      </div>
    );
  }

  const eaqiBand = getEAQIBand(data.aqi);

  const pollutants = [
    { key: "pm2_5", value: data.pm2_5 },
    { key: "pm10", value: data.pm10 },
    { key: "o3", value: data.o3 },
    { key: "no2", value: data.no2 },
    { key: "so2", value: data.so2 },
    { key: "co", value: data.co },
    ...(data.nh3 !== null && data.nh3 !== undefined ? [{ key: "nh3", value: data.nh3 }] : []),
  ];

  return (
    <div className={`p-5 rounded-xl bg-card border border-border/60 shadow-md flex flex-col gap-4 text-foreground ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wind className="w-5 h-5 text-sky-400" aria-hidden="true" />
          Air Pollution
        </h2>
        <span className="text-xs text-muted-foreground">European AQI</span>
      </div>

      {/* Main AQI Display */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-medium text-muted-foreground block">Index</span>
          <span className="text-4xl font-extrabold tracking-tight">
            {data.aqi ?? "N/A"}
          </span>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${eaqiBand.badgeClass}`}>
            {eaqiBand.label}
          </span>
        </div>
      </div>

      {/* Pollutant Cards */}
      <div className={isTabletGrid ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "flex flex-col gap-3"}>
        {pollutants.map(({ key, value }) => {
          const config = POLLUTANT_CONFIGS[key];
          if (!config) return null;
          const levelIdx = getPollutantLevelIndex(value, config.thresholds);
          const percent = value !== null ? Math.min(100, Math.max(5, (value / config.maxScale) * 100)) : 0;

          return (
            <div
              key={key}
              className="p-3 rounded-lg bg-muted/40 border border-border/40 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {config.symbol}
                  <span title={config.description} className="text-muted-foreground cursor-help">
                    <Info className="w-3.5 h-3.5 inline" aria-label={config.description} />
                  </span>
                </span>
                <span className="text-foreground font-mono">
                  {value !== null ? `${value} ${config.unit}` : "No data"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor:
                      levelIdx === 0 ? "#10b981" :
                      levelIdx === 1 ? "#84cc16" :
                      levelIdx === 2 ? "#eab308" :
                      levelIdx === 3 ? "#f97316" :
                      levelIdx === 4 ? "#ef4444" : "#71717a",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
