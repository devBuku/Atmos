import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getGeocode } from "../api";
import { Search, MapPin, Loader2, X } from "lucide-react";

export type LocationSelection = {
  name: string;
  lat: number;
  lng: number;
};

interface Props {
  currentLocationName: string;
  onSelectLocation: (location: LocationSelection) => void;
}

export default function LocationCombobox({
  currentLocationName,
  onSelectLocation,
}: Props) {
  const [query, setQuery] = useState(currentLocationName);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevLocation, setPrevLocation] = useState(currentLocationName);

  if (prevLocation !== currentLocationName) {
    setPrevLocation(currentLocationName);
    setQuery(currentLocationName);
  }

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      setDebouncedQuery(trimmed.length >= 2 ? trimmed : "");
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Query geocoding API
  const { data: results, isLoading } = useQuery({
    queryKey: ["geocode-search", debouncedQuery],
    queryFn: () => getGeocode(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 60 * 1000, // 1 hour geocode cache
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    setGeoError(null);
  };

  const handleSelect = (item: {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
  }) => {
    const parts = [item.name, item.state, item.country].filter(Boolean);
    // Avoid repeating state if it's the same as name
    const uniqueParts = parts.filter(
      (part, i, arr) => arr.indexOf(part) === i,
    );
    const fullName = uniqueParts.join(", ");

    setQuery(fullName);
    setIsOpen(false);
    onSelectLocation({
      name: fullName,
      lat: item.lat,
      lng: item.lon,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !results || results.length === 0) {
      if (e.key === "ArrowDown" && query.trim().length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const name = "My Location";
        setQuery(name);
        setIsOpen(false);
        onSelectLocation({ name, lat, lng });
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location access denied");
        } else {
          setGeoError("Unable to retrieve your location");
        }
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Search icon or loading spinner */}
        <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="location-options-list"
          aria-label="Search city or location"
          id="location-search-input"
          placeholder="Search city, region, country..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-20 py-2 text-sm bg-card/80 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
        />

        {/* Right action buttons: Clear + Use Location */}
        <div className="absolute right-1 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Clear location search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className={`p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer ${
              isLocating ? "opacity-60 cursor-not-allowed" : ""
            }`}
            title="Use my current location"
            aria-label="Use my current location"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            ) : (
              <MapPin className="w-4 h-4 text-sky-400" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Geolocation error notification */}
      {geoError && (
        <div className="absolute left-0 right-0 top-full mt-1 p-2 bg-destructive/15 border border-destructive/30 text-destructive text-xs rounded-lg z-50">
          {geoError}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && debouncedQuery.length >= 2 && (
        <ul
          id="location-options-list"
          role="listbox"
          aria-label="Location suggestions"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto p-1 text-sm animate-fade-in"
        >
          {isLoading && (
            <li className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching locations...
            </li>
          )}

          {!isLoading && results && results.length === 0 && (
            <li className="px-3 py-2.5 text-xs text-muted-foreground">
              No locations found for &ldquo;{debouncedQuery}&rdquo;
            </li>
          )}

          {!isLoading &&
            results &&
            results.map((item, index) => {
              const isSelected = index === highlightedIndex;

              return (
                <li
                  key={`${item.name}-${item.lat}-${item.lon}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 rounded-lg cursor-pointer flex flex-col transition-colors min-h-[44px] justify-center ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className="font-semibold text-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[item.state, item.country].filter(Boolean).join(", ")}
                  </span>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
