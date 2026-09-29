import { z } from "zod"

// Open-Meteo's raw response shape
export const OpenMeteoGeocodeResponse = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(), // state/region
      })
    )
    .optional(), // key is absent, not [], when there are zero matches
})

// Your existing shape, kept as-is so other code doesn't need to change
export const GeocodeSchema = z.array(
  z.object({
    name: z.string(),
    lat: z.number(),
    lon: z.number(),
    country: z.string(),
    state: z.string().optional(),
  })
)