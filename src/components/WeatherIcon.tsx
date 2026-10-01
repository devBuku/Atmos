import "../assets/weather-icons/css/weather-icons.css";
import clsx from "clsx";

type Props = {
  code: number;
  night?: boolean;
  className?: string;
  label?: string;
};

const rain: [string, string] = ["wi-day-rain", "wi-night-alt-rain"];
const showers: [string, string] = ["wi-day-showers", "wi-night-alt-showers"];
const sprinkle: [string, string] = ["wi-day-sprinkle", "wi-night-alt-sprinkle"];
const sleet: [string, string] = ["wi-day-sleet", "wi-night-alt-sleet"];
const rainMix: [string, string] = ["wi-day-rain-mix", "wi-night-alt-rain-mix"];
const snow: [string, string] = ["wi-day-snow", "wi-night-alt-snow"];
const fog: [string, string] = ["wi-day-fog", "wi-night-fog"];
const storm: [string, string] = [
  "wi-day-thunderstorm",
  "wi-night-alt-thunderstorm",
];

const WMO_ICONS: Record<number, [string, string]> = {
  0: ["wi-day-sunny", "wi-night-clear"],
  1: ["wi-day-sunny-overcast", "wi-night-alt-partly-cloudy"],
  2: ["wi-day-cloudy", "wi-night-alt-cloudy"],
  3: ["wi-cloudy", "wi-cloudy"],
  45: fog,
  48: fog,
  51: sprinkle,
  53: sprinkle,
  55: sprinkle,
  56: rainMix,
  57: rainMix,
  61: rain,
  63: rain,
  65: ["wi-rain", "wi-rain"],
  66: sleet,
  67: sleet,
  71: snow,
  73: snow,
  75: snow,
  77: snow,
  80: showers,
  81: showers,
  82: ["wi-storm-showers", "wi-storm-showers"],
  85: snow,
  86: snow,
  95: storm,
  96: storm,
  99: storm,
};

export default function WeatherIcon({
  code,
  night = false,
  className,
  label,
}: Props) {
  const [dayClass, nightClass] = WMO_ICONS[code] ?? ["wi-na", "wi-na"];

  return (
    <i
      role="img"
      aria-label={label ?? "Weather icon"}
      className={clsx(
        "wi w-8 text-center text-2xl",
        night ? nightClass : dayClass,
        className,
      )}
    />
  );
}
