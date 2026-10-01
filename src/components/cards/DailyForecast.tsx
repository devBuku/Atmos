import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";
import { useUnit } from "../../context/unitContext";
import {
  formatTemp,
  formatDayInTimezone,
  isTodayInTimezone,
} from "../../lib/formatters";
import { Droplets } from "lucide-react";

type Props = {
  coords: Coords;
};

const DailyForecast = ({ coords }: Props) => {
  const { data } = useWeather(coords);
  const { unit } = useUnit();

  // Find min/max across the whole week to scale the range bars relative to each other
  const overallMin = Math.min(...data.daily.map((d) => d.temp.min));
  const overallMax = Math.max(...data.daily.map((d) => d.temp.max));
  const tempRange = Math.max(1, overallMax - overallMin);

  return (
    <Card
      title="Daily Forecast"
      className="h-full min-h-[460px]"
      childrenClassName="flex flex-col divide-y divide-border/30"
    >
      {data.daily.map((day, index) => {
        const isToday = index === 0 || isTodayInTimezone(day.dt, data.timezone);
        const dayLabel = isToday
          ? "Today"
          : formatDayInTimezone(day.dt, data.timezone);

        const weather = day.weather[0];
        const popPercent = Math.round(day.pop * 100);

        // Calculate range bar positioning
        const barLeft = ((day.temp.min - overallMin) / tempRange) * 100;
        const barWidth = Math.max(
          12,
          ((day.temp.max - day.temp.min) / tempRange) * 100,
        );

        return (
          <div
            key={day.dt}
            className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/20 rounded-lg transition-colors gap-2 text-sm"
          >
            {/* Weekday */}
            <span
              className={`w-14 font-semibold shrink-0 ${
                isToday ? "text-sky-400 font-bold" : "text-foreground"
              }`}
            >
              {dayLabel}
            </span>

            {/* Icon + Precipitation chance */}
            <div className="flex items-center gap-1.5 w-20 shrink-0">
              <WeatherIcon
                className="text-xl text-foreground shrink-0"
                code={weather.id}
                night={false}
                label={weather.description}
              />
              {popPercent > 0 ? (
                <span
                  className="text-xs font-semibold text-sky-400 flex items-center gap-0.5"
                  title={`Precipitation probability: ${popPercent}%`}
                >
                  <Droplets className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                  {popPercent}%
                </span>
              ) : (
                <span className="w-6" aria-hidden="true" />
              )}
            </div>

            {/* Min Temp (WCAG AA compliant contrast) */}
            <span className="w-9 text-right font-medium text-muted-foreground tabular-nums">
              {formatTemp(day.temp.min, unit)}
            </span>

            {/* Small Range Bar */}
            <div
              className="flex-1 max-w-[120px] h-2 bg-muted/70 rounded-full relative overflow-hidden mx-1.5"
              aria-hidden="true"
            >
              <div
                className="absolute top-0 bottom-0 rounded-full bg-linear-to-r from-sky-400 via-emerald-400 to-amber-400 opacity-90 transition-all duration-300"
                style={{
                  left: `${barLeft}%`,
                  width: `${barWidth}%`,
                }}
              />
            </div>

            {/* Max Temp */}
            <span className="w-9 text-right font-bold text-foreground tabular-nums">
              {formatTemp(day.temp.max, unit)}
            </span>
          </div>
        );
      })}
    </Card>
  );
};

export default DailyForecast;
