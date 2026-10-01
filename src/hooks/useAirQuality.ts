import { useQuery } from "@tanstack/react-query";
import { getAirQuality } from "../api";
import type { Coords } from "../types";
import { roundCoords } from "../lib/utils";

export function useAirQuality(coords: Coords) {
  const rounded = roundCoords(coords.lat, coords.lng);
  return useQuery({
    queryKey: ["air", rounded],
    queryFn: () => getAirQuality(rounded),
  });
}
