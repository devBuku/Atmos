import { useSuspenseQuery } from "@tanstack/react-query";
import { getWeather } from "../api";
import type { Coords } from "../types";

/**
 * Single source of truth for the weather query so every card shares the same
 * cache entry. Callers must sit inside a <Suspense> boundary.
 */
export function useWeather(coords: Coords) {
  return useSuspenseQuery({
    queryKey: ["weather", coords],
    queryFn: () => getWeather({ lat: coords.lat, lng: coords.lng }),
  });
}
