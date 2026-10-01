import { useSuspenseQuery } from "@tanstack/react-query";
import { getWeather } from "../api";
import type { Coords } from "../types";
import { roundCoords } from "../lib/utils";

export function useWeather(coords: Coords) {
  const rounded = roundCoords(coords.lat, coords.lng);
  return useSuspenseQuery({
    queryKey: ["weather", rounded],
    queryFn: () => getWeather({ lat: rounded.lat, lng: rounded.lng }),
  });
}
