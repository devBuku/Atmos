// import { useQuery } from "@tanstack/react-query";
// import { getWeather } from "./api";
//
// import Card from "./components/cards/Card";
import CurrentWeather from "./components/cards/CurrentWeather";
import DailyForecast from "./components/cards/DailyForecast";
import HourlyForecast from "./components/cards/HourlyForecast";

function App() {
  // const { data } = useQuery({
  //   queryKey: ["weather"],
  //   queryFn: () => getWeather({ lat: 10, lon: 25 }),
  // });

  return (
    <div className="flex flex-col gap-8">
      <CurrentWeather />
      <HourlyForecast />
      <DailyForecast />
    </div>
  );
}

export default App;
