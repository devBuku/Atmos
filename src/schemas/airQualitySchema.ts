import { z } from "zod";

export const rawAirQualitySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string().optional(),
    interval: z.number().optional(),
    european_aqi: z.number().nullable().optional(),
    pm10: z.number().nullable().optional(),
    pm2_5: z.number().nullable().optional(),
    carbon_monoxide: z.number().nullable().optional(),
    nitrogen_dioxide: z.number().nullable().optional(),
    sulphur_dioxide: z.number().nullable().optional(),
    ozone: z.number().nullable().optional(),
    ammonia: z.number().nullable().optional(),
  }),
});

export const airQualitySchema = z.object({
  aqi: z.number().nullable(),
  pm2_5: z.number().nullable(),
  pm10: z.number().nullable(),
  o3: z.number().nullable(),
  no2: z.number().nullable(),
  so2: z.number().nullable(),
  co: z.number().nullable(),
  nh3: z.number().nullable(),
});

export type AirQuality = z.infer<typeof airQualitySchema>;
