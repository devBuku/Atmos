import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";

type Props = {
  coords: Coords;
};

function CurrentWeather({ coords }: Props) {
  const { data } = useWeather(coords);
  return (
    <Card
      title="Current Weather"
      childrenClassName="flex flex-col items-center gap-6"
    >
      <div className="flex flex-col gap-2 items-center">
        <h2 className="text-6xl font-semibold text-center">
          {Math.round(data.current.temp)}°C
        </h2>
        <WeatherIcon
          className="text-4xl"
          code={data.current.weather[0].id}
          night={data.current.weather[0].icon.endsWith("n")}
        />
        <h3 className="capitalize text-xl">
          {data.current.weather[0].description}
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xl text-center">Local Time:</p>
        <h3 className="text-4xl font-semibold">
          {new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: data.timezone,
          }).format(new Date(data.current.dt * 1000))}
        </h3>
      </div>
      <div className="flex justify-between w-full">
        <div className="flex flex-col gap-2 items-center">
          <p className="text-gray-500">Feels Like</p>
          <p>{Math.round(data.current.feels_like)}°C</p>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <p className="text-gray-500">Humidity</p>
          <p>{Math.round(data.current.humidity)}%</p>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <p className="text-gray-500">Wind</p>
          <p>{Math.round(data.current.wind_speed)}m/s</p>
        </div>
      </div>
    </Card>
  );
}

export default CurrentWeather;
