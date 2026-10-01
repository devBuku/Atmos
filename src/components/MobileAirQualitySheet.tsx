import type { Coords } from "../types";
import AirQualityPanel from "./AirQualityPanel";
import { X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  coords: Coords;
}

export default function MobileAirQualitySheet({
  isOpen,
  onClose,
  coords,
}: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Air Quality Details"
    >
      <div
        className="bg-card border-t border-border rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-muted-foreground/40 rounded-full mx-auto mb-2" />
        <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
          <h2 className="text-lg font-bold text-foreground">Air Quality Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close air quality sheet"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <AirQualityPanel coords={coords} className="border-0 shadow-none p-0" />
      </div>
    </div>
  );
}
