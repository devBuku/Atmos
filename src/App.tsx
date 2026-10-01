import { Suspense, useState, useRef, useCallback, lazy } from "react";
import AdditionalInfo from "./components/cards/AdditionalInfo";
import CurrentWeather from "./components/cards/CurrentWeather";
import DailyForecast from "./components/cards/DailyForecast";
import HourlyForecast from "./components/cards/HourlyForecast";
import type { Coords } from "./types";
import LocationCombobox, {
  type LocationSelection,
} from "./components/LocationCombobox";
import Header from "./components/Header";
import AirQualityPanel from "./components/AirQualityPanel";
import MobileAirQualitySheet from "./components/MobileAirQualitySheet";
import { CardErrorBoundary } from "./components/CardErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import {
  CurrentWeatherSkeleton,
  HourlyForecastSkeleton,
  DailyForecastSkeleton,
  AdditionalInfoSkeleton,
} from "./components/cards/Skeletons";
import { useAirQuality } from "./hooks/useAirQuality";

const Map = lazy(() => import("./components/Map"));

function MapPlaceholder() {
  return (
    <div
      className="w-full h-[350px] rounded-xl bg-card border border-border/60 shadow-md flex flex-col items-center justify-center gap-2 animate-pulse text-muted-foreground"
      aria-label="Loading interactive map"
    >
      <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      <span className="text-xs font-medium">Loading interactive map...</span>
    </div>
  );
}

interface LocationState {
  name: string;
  lat: number;
  lng: number;
}

const DEFAULT_LOCATION: LocationState = {
  name: "Tokyo, Japan",
  lat: 35.6895,
  lng: 139.6917,
};

function getInitialLocation(): LocationState {
  if (typeof window !== "undefined") {
    // 1. Check URL query params
    const params = new URLSearchParams(window.location.search);
    const latParam = params.get("lat");
    const lonParam = params.get("lon") ?? params.get("lng");
    const nameParam = params.get("name");

    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          name: nameParam
            ? decodeURIComponent(nameParam)
            : `Custom location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          lat,
          lng,
        };
      }
    }

    // 2. Check localStorage
    try {
      const saved = localStorage.getItem("atmos_last_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number" &&
          typeof parsed.name === "string"
        ) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  return DEFAULT_LOCATION;
}

function App() {
  const [location, setLocation] = useState<LocationState>(getInitialLocation);
  const [isMobileAirOpen, setIsMobileAirOpen] = useState(false);
  const mapClickTimerRef = useRef<number | null>(null);

  const coords: Coords = { lat: location.lat, lng: location.lng };
  const { data: airData } = useAirQuality(coords);

  const updateLocation = useCallback((newLoc: LocationState) => {
    setLocation(newLoc);

    // Persist to localStorage and sync URL query parameters
    try {
      localStorage.setItem("atmos_last_location", JSON.stringify(newLoc));
      const url = new URL(window.location.href);
      url.searchParams.set("lat", newLoc.lat.toFixed(4));
      url.searchParams.set("lon", newLoc.lng.toFixed(4));
      url.searchParams.set("name", newLoc.name);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Ignore
    }
  }, []);

  const handleSelectLocation = useCallback(
    (loc: LocationSelection) => {
      updateLocation({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
      });
    },
    [updateLocation],
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      // Debounce rapid map clicks
      if (mapClickTimerRef.current) {
        window.clearTimeout(mapClickTimerRef.current);
      }

      mapClickTimerRef.current = window.setTimeout(() => {
        const roundedLat = Math.round(lat * 10000) / 10000;
        const roundedLng = Math.round(lng * 10000) / 10000;
        const name = `Custom location (${roundedLat.toFixed(2)}, ${roundedLng.toFixed(2)})`;

        updateLocation({
          name,
          lat: roundedLat,
          lng: roundedLng,
        });
      }, 150);
    },
    [updateLocation],
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        locationSlot={
          <LocationCombobox
            currentLocationName={location.name}
            onSelectLocation={handleSelectLocation}
          />
        }
        onOpenMobileAirQuality={() => setIsMobileAirOpen(true)}
        aqiValue={airData?.aqi}
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8 flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col xl:flex-row gap-5 sm:gap-6 items-stretch">
          {/* Main Column */}
          <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
            {/* Map (outside weather Suspense deliberately to preserve zoom/pan state) */}
            <div className="w-full">
              <Suspense fallback={<MapPlaceholder />}>
                <Map
                  coords={coords}
                  onMapClick={handleMapClick}
                  locationName={location.name}
                />
              </Suspense>
            </div>

            {/* Responsive Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 xl:gap-6">
              {/* Current Weather */}
              <div className="order-1 xl:col-start-1 xl:row-start-1">
                <CardErrorBoundary>
                  <Suspense fallback={<CurrentWeatherSkeleton />}>
                    <CurrentWeather coords={coords} />
                  </Suspense>
                </CardErrorBoundary>
              </div>

              {/* Hourly Forecast */}
              <div className="order-2 xl:col-start-1 xl:row-start-2">
                <CardErrorBoundary>
                  <Suspense fallback={<HourlyForecastSkeleton />}>
                    <HourlyForecast coords={coords} />
                  </Suspense>
                </CardErrorBoundary>
              </div>

              {/* Daily Forecast */}
              <div className="order-3 md:order-3 xl:order-none xl:col-start-2 xl:row-start-1 xl:row-span-2">
                <CardErrorBoundary>
                  <Suspense fallback={<DailyForecastSkeleton />}>
                    <DailyForecast coords={coords} />
                  </Suspense>
                </CardErrorBoundary>
              </div>

              {/* Additional Weather Info */}
              <div className="order-4 md:order-4 xl:order-none xl:col-start-1 xl:row-start-3">
                <CardErrorBoundary>
                  <Suspense fallback={<AdditionalInfoSkeleton />}>
                    <AdditionalInfo coords={coords} />
                  </Suspense>
                </CardErrorBoundary>
              </div>
            </div>
          </main>


          {/* Desktop Air Pollution Sidebar (>=1280px / xl) */}
          <aside
            className="hidden xl:block w-[280px] 2xl:w-[300px] shrink-0 sticky top-20 self-start"
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

      {/* Offline / network connectivity banner */}
      <OfflineBanner />
    </div>
  );
}

export default App;
