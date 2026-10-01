import { useAirQuality } from "../hooks/useAirQuality";
import type { Coords } from "../types";
import {
  getEAQIBand,
  POLLUTANT_CONFIGS,
  LEVEL_NAMES,
  getPollutantLevelIndex,
  getPollutantLevel,
} from "../constants/airQuality";
import { Wind, Info } from "lucide-react";

interface Props {
  coords: Coords;
  className?: string;
  isTabletGrid?: boolean;
}

export default function AirQualityPanel({
  coords,
  className = "",
  isTabletGrid = false,
}: Props) {
  const { data, isLoading, isError } = useAirQuality(coords);

  if (isLoading) {
    return (
      <section
        aria-label="Air Pollution Information"
        className={`p-5 rounded-xl bg-card border border-border/60 shadow-md animate-pulse ${className}`}
      >
        <div className="h-6 w-36 bg-muted rounded mb-4" />
        <div className="h-24 bg-muted rounded-xl mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/60 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section
        aria-label="Air Pollution Information"
        className={`p-5 rounded-xl bg-card border border-border/60 shadow-md ${className}`}
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-foreground">
          <Wind className="w-5 h-5 text-sky-400" aria-hidden="true" />
          Air Pollution
        </h2>
        <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-center">
          <p className="text-sm text-muted-foreground">
            Air quality data is currently unavailable for this location.
          </p>
        </div>
      </section>
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
    ...(data.nh3 !== null && data.nh3 !== undefined
      ? [{ key: "nh3", value: data.nh3 }]
      : []),
  ];

  return (
    <section
      aria-label="Air Pollution"
      className={`p-5 rounded-xl bg-card border border-border/60 shadow-md flex flex-col gap-4 text-foreground transition-all duration-200 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
          <Wind className="w-5 h-5 text-sky-400" aria-hidden="true" />
          Air Pollution
        </h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
          European AQI
        </span>
      </div>

      {/* Main AQI Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-muted/60 to-muted/20 border border-border/40 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            AQI Index
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-foreground">
            {data.aqi ?? "N/A"}
          </span>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${eaqiBand.badgeClass}`}
          >
            {eaqiBand.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {data.aqi !== null && data.aqi <= 20
              ? "Clean air"
              : data.aqi !== null && data.aqi <= 60
              ? "Acceptable"
              : "Polluted"}
          </span>
        </div>
      </div>

      {/* Pollutant Cards */}
      <div
        className={
          isTabletGrid
            ? "grid grid-cols-1 md:grid-cols-2 gap-3"
            : "flex flex-col gap-3"
        }
      >
        {pollutants.map(({ key, value }) => {
          const config = POLLUTANT_CONFIGS[key];
          if (!config) return null;

          const levelIdx = getPollutantLevelIndex(value, config.thresholds);
          const levelName = getPollutantLevel(value, config.thresholds);
          const percent =
            value !== null
              ? Math.min(100, Math.max(4, (value / config.maxScale) * 100))
              : 0;

          const stepColors = [
            "bg-emerald-500",
            "bg-lime-500",
            "bg-yellow-500",
            "bg-orange-500",
            "bg-red-500",
          ];

          return (
            <div
              key={key}
              className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">
                    {config.symbol}
                  </span>
                  <div className="relative group">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground cursor-help p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label={`${config.name}: ${config.description}`}
                      title={config.description}
                    >
                      <Info className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-foreground">
                    {value !== null ? `${value} ${config.unit}` : "No data"}
                  </span>
                  {value !== null && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        levelIdx === 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : levelIdx === 1
                          ? "bg-lime-500/20 text-lime-400"
                          : levelIdx === 2
                          ? "bg-yellow-500/20 text-yellow-400"
                          : levelIdx === 3
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {levelName}
                    </span>
                  )}
                </div>
              </div>

              {/* Concentration Bar */}
              <div className="w-full h-1.5 bg-muted/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor:
                      levelIdx === 0
                        ? "#10b981"
                        : levelIdx === 1
                        ? "#84cc16"
                        : levelIdx === 2
                        ? "#eab308"
                        : levelIdx === 3
                        ? "#f97316"
                        : levelIdx === 4
                        ? "#ef4444"
                        : "#71717a",
                  }}
                />
              </div>

              {/* 5-Step Scale with Current Level Highlighted */}
              <div className="grid grid-cols-5 gap-1 pt-0.5" aria-hidden="true">
                {LEVEL_NAMES.map((name, idx) => {
                  const isCurrent = idx === levelIdx;
                  const isPassed = idx < levelIdx;
                  return (
                    <div
                      key={name}
                      className={`h-1 rounded-full transition-all ${
                        isCurrent
                          ? `${stepColors[idx]} ring-1.5 ring-foreground/40`
                          : isPassed
                          ? `${stepColors[idx]} opacity-40`
                          : "bg-muted"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span className={levelIdx === 0 ? "text-emerald-400 font-bold" : ""}>
                  Good
                </span>
                <span className={levelIdx === 1 ? "text-lime-400 font-bold" : ""}>
                  Fair
                </span>
                <span className={levelIdx === 2 ? "text-yellow-400 font-bold" : ""}>
                  Mod
                </span>
                <span className={levelIdx === 3 ? "text-orange-400 font-bold" : ""}>
                  Poor
                </span>
                <span className={levelIdx === 4 ? "text-red-400 font-bold" : ""}>
                  V.Poor
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
