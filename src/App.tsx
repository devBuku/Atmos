import { Suspense, useState } from "react";
import AdditionalInfo from "./components/cards/AdditionalInfo";
import CurrentWeather from "./components/cards/CurrentWeather";
import DailyForecast from "./components/cards/DailyForecast";
import HourlyForecast from "./components/cards/HourlyForecast";
import Map from "./components/Map";
import type { Coords } from "./types";
import LocationDropdown from "./components/dropdowns/LocationDropdown";
import Header from "./components/Header";
import AirQualityPanel from "./components/AirQualityPanel";
import MobileAirQualitySheet from "./components/MobileAirQualitySheet";
import {
  CurrentWeatherSkeleton,
  HourlyForecastSkeleton,
  DailyForecastSkeleton,
  AdditionalInfoSkeleton,
} from "./components/cards/Skeletons";
import { useQuery } from "@tanstack/react-query";
import { getGeocode } from "./api";
import { useAirQuality } from "./hooks/useAirQuality";

function App() {
  const [location, setLocation] = useState("Tokyo");
  const [mapCoords, setMapCoords] = useState<Coords | null>(null);
  const [isMobileAirOpen, setIsMobileAirOpen] = useState(false);

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
  const coords: Coords =
    mapCoords ??
    (geocoded
      ? { lat: geocoded.lat, lng: geocoded.lon }
      : { lat: 10, lng: 10 });

  const { data: airData } = useAirQuality(coords);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        locationSlot={
          <LocationDropdown
            location={location}
            onLocationChange={handleLocationChange}
          />
        }
        onOpenMobileAirQuality={() => setIsMobileAirOpen(true)}
        aqiValue={airData?.aqi}
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Main Column */}
          <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
            {/* Map (outside Suspense deliberately) */}
            <div className="w-full">
              <Map coords={coords} onMapClick={handleMapClick} />
            </div>

            {/* Responsive Card Grid:
                - Desktop (xl): 3 columns:
                  Col 1: Current Weather
                  Col 2: Hourly Forecast (top) + Additional Info (bottom)
                  Col 3: Daily Forecast (spans both rows)
                - Mobile (<768px):
                  Single column in order: current, hourly, daily, additional
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Current Weather */}
              <div className="order-1 xl:col-start-1 xl:row-start-1">
                <Suspense fallback={<CurrentWeatherSkeleton />}>
                  <CurrentWeather coords={coords} />
                </Suspense>
              </div>

              {/* Hourly Forecast */}
              <div className="order-2 xl:col-start-2 xl:row-start-1">
                <Suspense fallback={<HourlyForecastSkeleton />}>
                  <HourlyForecast coords={coords} />
                </Suspense>
              </div>

              {/* Daily Forecast */}
              <div className="order-3 md:order-3 xl:order-none xl:col-start-3 xl:row-start-1 xl:row-span-2">
                <Suspense fallback={<DailyForecastSkeleton />}>
                  <DailyForecast coords={coords} />
                </Suspense>
              </div>

              {/* Additional Weather Info */}
              <div className="order-4 md:order-4 xl:order-none xl:col-start-2 xl:row-start-2">
                <Suspense fallback={<AdditionalInfoSkeleton />}>
                  <AdditionalInfo coords={coords} />
                </Suspense>
              </div>
            </div>
          </main>

          {/* Desktop Air Pollution Sidebar (>=1280px / xl) */}
          <aside
            className="hidden xl:block w-[300px] shrink-0 sticky top-20"
            aria-label="Air pollution panel"
          >
            <AirQualityPanel coords={coords} />
          </aside>
        </div>

        {/* Tablet Air Pollution Panel (768px - 1279px) */}
        <aside
          className="hidden md:block xl:hidden w-full mt-2"
          aria-label="Air pollution panel"
        >
          <AirQualityPanel coords={coords} isTabletGrid={true} />
        </aside>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Weather data by{" "}
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Open-Meteo.com
            </a>{" "}
            (CC BY 4.0)
          </p>
          <p>
            Map data &copy;{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </footer>
      </div>

      {/* Mobile Air Quality Bottom Sheet (<768px) */}
      <MobileAirQualitySheet
        isOpen={isMobileAirOpen}
        onClose={() => setIsMobileAirOpen(false)}
        coords={coords}
      />
    </div>
  );
}

export default App;
