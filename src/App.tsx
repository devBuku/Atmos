import { Suspense, useState } from "react";
import AdditionalInfo from "./components/cards/AdditionalInfo";
import CurrentWeather from "./components/cards/CurrentWeather";
import DailyForecast from "./components/cards/DailyForecast";
import HourlyForecast from "./components/cards/HourlyForecast";
import Map from "./components/Map";
import type { Coords } from "./types";
import LocationDropdown from "./components/dropdowns/LocationDropdown";
import { useQuery } from "@tanstack/react-query";
import { getGeocode } from "./api";

function App() {
  const [location, setLocation] = useState("Tokyo");
  const [mapCoords, setMapCoords] = useState<Coords | null>(null);

  const { data: geoCodeData } = useQuery({
    queryKey: ["geocode", location],
    queryFn: () => getGeocode(location),
    placeholderData: (previous) => previous,
  });

  const handleMapClick = (lat: number, lng: number) => {
    setMapCoords({ lat, lng });
  };

  const handleLocationChange = (city: string) => {
    setLocation(city);
    setMapCoords(null);
  };

  const geocoded = geoCodeData?.[0];
  const coords =
    mapCoords ??
    (geocoded
      ? { lat: geocoded.lat, lng: geocoded.lon }
      : ({ lat: 10, lng: 10 } satisfies Coords));

  return (
    <div className="flex flex-col gap-8">
      <LocationDropdown
        location={location}
        onLocationChange={handleLocationChange}
      />
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
