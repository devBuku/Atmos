import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import { useWeather } from "../../hooks/useWeather";
import type { Coords } from "../../types";

type Props = {
  coords: Coords;
};

const DailyForecast = ({ coords }: Props) => {
  const { data } = useWeather(coords);
  return (
    <Card title="Daily Forecast" childrenClassName="flex flex-col gap-4">
      {data.daily.map(function (day) {
        return (
          <div key={day.dt} className="flex justify-between">
            <p className="w-9">
              {new Date(day.dt * 1000).toLocaleDateString(undefined, {
                weekday: "short",
              })}
            </p>
            <WeatherIcon
              code={day.weather[0].id}
              night={day.weather[0].icon.endsWith("n")}
            />
            <p>{Math.round(day.temp.day)}°C</p>
            <p className="text-gray-500/75">{Math.round(day.temp.min)}°C</p>
            <p className="text-gray-500/75">{Math.round(day.temp.max)}°C</p>
          </div>
        );
      })}
    </Card>
  );
};

export default DailyForecast;
