import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";
import { useUnit } from "../../context/unitContext";
import {
  formatTempWithUnit,
  formatWind,
  getWindDirection,
  formatTimeInTimezone,
} from "../../lib/formatters";
import { Navigation } from "lucide-react";

type Props = {
  coords: Coords;
};

function CurrentWeather({ coords }: Props) {
  const { data } = useWeather(coords);
  const { unit } = useUnit();

  const currentWeather = data.current.weather[0];
  const isNight = currentWeather.icon.endsWith("n");
  const localTimeFormatted = formatTimeInTimezone(data.current.dt, data.timezone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const windDirection = getWindDirection(data.current.wind_deg);

  return (
    <Card
      title="Current Weather"
      className="h-full min-h-[380px] flex flex-col justify-between"
      childrenClassName="flex flex-col items-center justify-between flex-1 gap-6 pt-2"
    >
      {/* Temperature & Condition */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="text-6xl font-bold tracking-tight text-foreground">
          {formatTempWithUnit(data.current.temp, unit)}
        </div>
        <div className="my-1">
          <WeatherIcon
            className="text-5xl text-foreground"
            code={currentWeather.id}
            night={isNight}
            label={currentWeather.description}
          />
        </div>
        <div className="capitalize text-lg font-medium text-foreground/90">
          {currentWeather.description}
        </div>
      </div>

      {/* Local Time in location timezone */}
      <div className="flex flex-col items-center gap-1 text-center bg-muted/40 border border-border/40 rounded-xl px-6 py-2.5 w-full">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Local Time
        </span>
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {localTimeFormatted}
        </div>
        <span className="text-xs text-muted-foreground truncate max-w-full">
          {data.timezone.replace(/_/g, " ")}
        </span>
      </div>

      {/* Metrics Row (Feels Like, Humidity, Wind) */}
      <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-border/50 text-center">
        <div className="flex flex-col gap-1 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Feels Like
          </span>
          <span className="text-base font-bold text-foreground">
            {formatTempWithUnit(data.current.feels_like, unit)}
          </span>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Humidity
          </span>
          <span className="text-base font-bold text-foreground">
            {Math.round(data.current.humidity)}%
          </span>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Wind
          </span>
          <span className="text-base font-bold text-foreground flex items-center gap-1">
            {formatWind(data.current.wind_speed, unit)}
            <Navigation
              className="w-3.5 h-3.5 text-sky-400 inline-block shrink-0"
              style={{ transform: `rotate(${data.current.wind_deg}deg)` }}
              aria-label={`Wind direction ${windDirection}`}
            />
          </span>
        </div>
      </div>
    </Card>
  );
}

export default CurrentWeather;
