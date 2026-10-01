import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";
import { useUnit } from "../../context/unitContext";
import { formatTemp, formatTimeInTimezone } from "../../lib/formatters";
import { Droplets } from "lucide-react";

type Props = {
  coords: Coords;
};

function HourlyForecast({ coords }: Props) {
  const { data } = useWeather(coords);
  const { unit } = useUnit();

  return (
    <Card
      title="Hourly Forecast (48 Hours)"
      className="min-h-[175px]"
      childrenClassName="relative"
    >
      <div
        className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin snap-x snap-mandatory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-0.5"
        tabIndex={0}
        role="region"
        aria-label="Hourly forecast for the next 48 hours. Use left and right arrow keys to scroll."
      >
        {data.hourly.map((hour, index) => {
          const isNow = index === 0;
          const timeFormatted = isNow
            ? "Now"
            : formatTimeInTimezone(hour.dt, data.timezone, {
                hour: "numeric",
                hour12: true,
              });

          const weather = hour.weather[0];
          const isNight = weather.icon.endsWith("n");
          const popPercent = Math.round(hour.pop * 100);

          return (
            <div
              key={hour.dt}
              className={`flex flex-col gap-1.5 items-center p-2.5 rounded-xl min-w-[4.5rem] shrink-0 snap-start transition-colors border ${
                isNow
                  ? "bg-sky-500/15 border-sky-500/50 shadow-xs"
                  : "bg-muted/30 border-border/40 hover:bg-muted/60"
              }`}
            >
              <span
                className={`text-xs whitespace-nowrap font-medium ${
                  isNow ? "text-sky-400 font-bold" : "text-muted-foreground"
                }`}
              >
                {timeFormatted}
              </span>

              <WeatherIcon
                className="text-2xl text-foreground my-0.5"
                code={weather.id}
                night={isNight}
                label={weather.description}
              />

              <span className="text-sm font-bold text-foreground">
                {formatTemp(hour.temp, unit)}
              </span>

              <div className="h-4 flex items-center justify-center">
                {popPercent > 0 ? (
                  <span
                    className="text-[11px] font-semibold text-sky-400 flex items-center gap-0.5"
                    title={`Precipitation probability: ${popPercent}%`}
                  >
                    <Droplets className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                    {popPercent}%
                  </span>
                ) : (
                  <span className="text-[11px] text-transparent" aria-hidden="true">
                    0%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default HourlyForecast;
