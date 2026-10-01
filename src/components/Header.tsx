import type { ReactNode } from "react";
import UnitToggle from "./UnitToggle";
import ThemeToggle from "./ThemeToggle";
import { CloudSun, Wind } from "lucide-react";

interface HeaderProps {
  locationSlot: ReactNode;
  onOpenMobileAirQuality?: () => void;
  aqiValue?: number | null;
}

export default function Header({
  locationSlot,
  onOpenMobileAirQuality,
  aqiValue,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-background/85 backdrop-blur-md border-b border-border/60 py-2.5 sm:py-3 px-3 sm:px-5 lg:px-8">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 basis-[calc(100%-8rem)] sm:basis-auto">
          <div className="flex items-center gap-2 text-foreground font-bold tracking-tight shrink-0">
            <CloudSun className="w-6 h-6 text-sky-500" aria-hidden="true" />
            <span className="text-xl font-bold hidden sm:inline-block">Atmos</span>
          </div>
          <div className="w-full max-w-none sm:max-w-sm">
            {locationSlot}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Air Quality quick action button */}
          <button
            type="button"
            onClick={onOpenMobileAirQuality}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card/80 text-xs font-semibold text-foreground hover:bg-card min-h-[44px] min-w-[44px] transition-colors cursor-pointer"
            aria-label="Open Air Quality details"
          >
            <Wind className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>{aqiValue !== null && aqiValue !== undefined ? `AQI ${aqiValue}` : "Air"}</span>
          </button>

          <UnitToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
