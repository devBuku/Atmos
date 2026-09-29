import { Suspense, useState } from "react";
import AdditionalInfo from "./components/cards/AdditionalInfo";
import CurrentWeather from "./components/cards/CurrentWeather";
import DailyForecast from "./components/cards/DailyForecast";
import HourlyForecast from "./components/cards/HourlyForecast";
import Map from "./components/Map";
import type { Coords } from "./types";

function App() {
  const [coords, setCoords] = useState<Coords>({ lat: 10, lng: 10 });

  const handleMapClick = (lat: number, lng: number) => {
    setCoords({ lat, lng });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Kept outside the boundary: remounting MapContainer would rebuild the
          Leaflet map and throw away the user's zoom/pan on every click. */}
      <Map coords={coords} onMapClick={handleMapClick} />
      <Suspense fallback={<WeatherSkeleton />}>
        <CurrentWeather coords={coords} />
        <HourlyForecast coords={coords} />
        <DailyForecast coords={coords} />
        <AdditionalInfo coords={coords} />
      </Suspense>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="p-4 rounded-xl bg-zinc-900 shadow-md h-48 animate-pulse"
        />
      ))}
    </>
  );
}

export default App;
