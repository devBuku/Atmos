import Card from "./Card";
import clsx from "clsx";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";

type Props = {
  coords: Coords;
};

export default function AdditionalInfo({ coords }: Props) {
  const { data } = useWeather(coords);
  return (
    <Card
      title="Additional Weather Info"
      childrenClassName="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      {rows.map(({ label, value, icon }) => (
        <div className="flex justify-between" key={value}>
          <div className="flex gap-4">
            <span className="text-gray-500">{label}</span>
            <i
              className={clsx("wi text-2xl invert", icon)}
              aria-hidden="true"
            />
          </div>
          <span>
            <FormatComponent value={value} number={data.current[value]} />
          </span>
        </div>
      ))}
    </Card>
  );
}

function FormatComponent({ value, number }: { value: string; number: number }) {
  if (value === "sunrise" || value === "sunset")
    return new Date(number * 1000).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return number;
}

const rows = [
  { label: "Cloudiness (%)", value: "clouds", icon: "wi-cloud" },
  { label: "UV Index", value: "uvi", icon: "wi-hot" },
  { label: "Wind Direction", value: "wind_deg", icon: "wi-strong-wind" },
  { label: "Pressure (hPa)", value: "pressure", icon: "wi-barometer" },
  { label: "Sunrise", value: "sunrise", icon: "wi-sunrise" },
  { label: "Sunset", value: "sunset", icon: "wi-sunset" },
] as const;
