import { useSuspenseQuery } from "@tanstack/react-query";
import { getWeather } from "../api";
import type { Coords } from "../types";
import { roundCoords } from "../lib/utils";

/**
 * Single source of truth for the weather query so every card shares the same
 * cache entry. Callers must sit inside a <Suspense> boundary.
 */
export function useWeather(coords: Coords) {
  const rounded = roundCoords(coords.lat, coords.lng);
  return useSuspenseQuery({
    queryKey: ["weather", rounded],
    queryFn: () => getWeather({ lat: rounded.lat, lng: rounded.lng }),
  });
}
