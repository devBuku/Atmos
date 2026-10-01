import Card from "./Card";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";
import {
  getWindDirection,
  getUVInfo,
  formatTimeInTimezone,
} from "../../lib/formatters";
import {
  Cloud,
  Sun,
  Navigation,
  Gauge,
  Sunrise,
  Sunset,
} from "lucide-react";

type Props = {
  coords: Coords;
};

export default function AdditionalInfo({ coords }: Props) {
  const { data } = useWeather(coords);
  const current = data.current;

  const windDirection = getWindDirection(current.wind_deg);
  const uvInfo = getUVInfo(current.uvi);

  const tiles = [
    {
      label: "Cloudiness",
      value: `${Math.round(current.clouds)}%`,
      icon: Cloud,
      iconColor: "text-sky-400",
    },
    {
      label: "UV Index",
      value: `${Math.round(current.uvi)}`,
      badge: uvInfo.label,
      badgeColor: uvInfo.color,
      icon: Sun,
      iconColor: "text-amber-400",
    },
    {
      label: "Wind Direction",
      value: `${current.wind_deg}° ${windDirection}`,
      icon: Navigation,
      iconColor: "text-sky-400",
      iconStyle: { transform: `rotate(${current.wind_deg}deg)` },
    },
    {
      label: "Pressure",
      value: `${Math.round(current.pressure)} hPa`,
      icon: Gauge,
      iconColor: "text-emerald-400",
    },
    {
      label: "Sunrise",
      value: formatTimeInTimezone(current.sunrise, data.timezone),
      icon: Sunrise,
      iconColor: "text-amber-400",
    },
    {
      label: "Sunset",
      value: formatTimeInTimezone(current.sunset, data.timezone),
      icon: Sunset,
      iconColor: "text-orange-400",
    },
  ];

  return (
    <Card
      title="Additional Weather Info"
      className="min-h-[220px]"
      childrenClassName="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.label}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-card border border-border/40 shrink-0">
                <Icon
                  className={`w-4 h-4 ${tile.iconColor}`}
                  style={tile.iconStyle}
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {tile.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
              <span>{tile.value}</span>
              {tile.badge && (
                <span className={`text-xs font-medium ${tile.badgeColor}`}>
                  ({tile.badge})
                </span>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
