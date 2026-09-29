import { useSuspenseQuery } from "@tanstack/react-query";
import { getWeather } from "../../api";
import Card from "./Card";
import WeatherIcon from "../WeatherIcon";

function HourlyForecast() {
  const { data } = useSuspenseQuery({
    queryKey: ["weather"],
    queryFn: () => getWeather({ lat: 10, lon: 25 }),
  });
  return (
    <Card
      title="Hourly Forecast"
      childrenClassName="flex gap-6 overflow-x-scroll"
    >
      {data.hourly.map(function (hour) {
        return (
          <div className="flex flex-col gap-2 items-center p-2">
            <p className="whitespace-nowrap">
              {new Date(hour.dt * 1000).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <WeatherIcon
              code={hour.weather[0].id}
              night={hour.weather[0].icon.endsWith("n")}
            />
            <p>{Math.round(hour.temp)}°C</p>
          </div>
        );
      })}
    </Card>
  );
}

export default HourlyForecast;
