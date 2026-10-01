import type { z } from "zod";
import { weatherSchema } from "./schemas/weatherSchema";
import { GeocodeSchema, OpenMeteoGeocodeResponse } from "./schemas/geoCodeSchema";
import {
  airQualitySchema,
  rawAirQualitySchema,
  type AirQuality,
} from "./schemas/airQualitySchema";

export type Weather = z.infer<typeof weatherSchema>;
export type { AirQuality };

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "surface_pressure",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "weather_code",
  "is_day",
];

const HOURLY = [
  "temperature_2m",
  "apparent_temperature",
  "surface_pressure",
  "relative_humidity_2m",
  "dew_point_2m",
  "uv_index",
  "cloud_cover",
  "visibility",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "weather_code",
  "is_day",
  "precipitation_probability",
];

const DAILY = [
  "sunrise",
  "sunset",
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "uv_index_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_direction_10m_dominant",
];

// WMO weather code -> [main, description, OpenWeather-style icon prefix]
const WMO: Record<number, [string, string, string]> = {
  0: ["Clear", "clear sky", "01"],
  1: ["Clear", "mainly clear", "02"],
  2: ["Clouds", "partly cloudy", "03"],
  3: ["Clouds", "overcast clouds", "04"],
  45: ["Fog", "fog", "50"],
  48: ["Fog", "rime fog", "50"],
  51: ["Drizzle", "light drizzle", "09"],
  53: ["Drizzle", "moderate drizzle", "09"],
  55: ["Drizzle", "dense drizzle", "09"],
  56: ["Drizzle", "freezing drizzle", "09"],
  57: ["Drizzle", "heavy freezing drizzle", "09"],
  61: ["Rain", "light rain", "10"],
  63: ["Rain", "moderate rain", "10"],
  65: ["Rain", "heavy rain", "10"],
  66: ["Rain", "freezing rain", "10"],
  67: ["Rain", "heavy freezing rain", "10"],
  71: ["Snow", "light snow", "13"],
  73: ["Snow", "moderate snow", "13"],
  75: ["Snow", "heavy snow", "13"],
  77: ["Snow", "snow grains", "13"],
  80: ["Rain", "light rain showers", "09"],
  81: ["Rain", "moderate rain showers", "09"],
  82: ["Rain", "violent rain showers", "09"],
  85: ["Snow", "light snow showers", "13"],
  86: ["Snow", "heavy snow showers", "13"],
  95: ["Thunderstorm", "thunderstorm", "11"],
  96: ["Thunderstorm", "thunderstorm with hail", "11"],
  99: ["Thunderstorm", "thunderstorm with heavy hail", "11"],
};

function condition(code: number, isDay: boolean) {
  const [main, description, icon] = WMO[code] ?? ["Clouds", "unknown", "04"];
  return [{ id: code, main, description, icon: icon + (isDay ? "d" : "n") }];
}

const mean = (a: number[]) => a.reduce((s, n) => s + n, 0) / (a.length || 1);

type Series = (number | null)[];

export async function getWeather({
  lat,
  lng: lon,
}: {
  lat: number;
  lng: number;
}): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: CURRENT.join(","),
    hourly: HOURLY.join(","),
    daily: DAILY.join(","),
    timezone: "auto",
    timeformat: "unixtime",
    wind_speed_unit: "ms", // m/s, same as OpenWeather metric
    forecast_days: "8",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);
  const json = await res.json();

  const h = json.hourly as Record<string, Series>;
  const d = json.daily as Record<string, Series>;
  const c = json.current as Record<string, number>;

  const hv = (key: string, i: number) => h[key][i] ?? 0;
  const dv = (key: string, i: number) => d[key][i] ?? 0;
  const hourIndex = (key: string, day: number, hour: number) =>
    hv(key, day * 24 + hour);

  // Index of the current hour inside the hourly arrays
  const nowHour = Math.floor(c.time / 3600) * 3600;
  const found = (h.time as number[]).indexOf(nowHour);
  const start = found === -1 ? 0 : found;

  const hourly = (h.time as number[]).map((dt, i) => ({
    dt,
    temp: hv("temperature_2m", i),
    feels_like: hv("apparent_temperature", i),
    pressure: hv("surface_pressure", i),
    humidity: hv("relative_humidity_2m", i),
    dew_point: hv("dew_point_2m", i),
    uvi: hv("uv_index", i),
    clouds: hv("cloud_cover", i),
    visibility: hv("visibility", i),
    wind_speed: hv("wind_speed_10m", i),
    wind_deg: hv("wind_direction_10m", i),
    wind_gust: hv("wind_gusts_10m", i),
    weather: condition(hv("weather_code", i), hv("is_day", i) === 1),
    pop: hv("precipitation_probability", i) / 100, // % -> 0..1
  }));

  const daily = (d.time as number[]).map((dt, i) => {
    const slice = (key: string) =>
      h[key].slice(i * 24, i * 24 + 24).map((x) => x ?? 0);
    const max = dv("temperature_2m_max", i);
    const min = dv("temperature_2m_min", i);
    const weather = condition(dv("weather_code", i), true);

    return {
      dt,
      sunrise: dv("sunrise", i),
      sunset: dv("sunset", i),
      summary: `${weather[0].description}, high ${Math.round(max)}°, low ${Math.round(min)}°`,
      temp: {
        day: hourIndex("temperature_2m", i, 12),
        min,
        max,
        night: hourIndex("temperature_2m", i, 0),
        eve: hourIndex("temperature_2m", i, 18),
        morn: hourIndex("temperature_2m", i, 6),
      },
      feels_like: {
        day: hourIndex("apparent_temperature", i, 12),
        night: hourIndex("apparent_temperature", i, 0),
        eve: hourIndex("apparent_temperature", i, 18),
        morn: hourIndex("apparent_temperature", i, 6),
      },
      pressure: mean(slice("surface_pressure")),
      humidity: mean(slice("relative_humidity_2m")),
      dew_point: mean(slice("dew_point_2m")),
      wind_speed: dv("wind_speed_10m_max", i),
      wind_deg: dv("wind_direction_10m_dominant", i),
      wind_gust: dv("wind_gusts_10m_max", i),
      weather,
      clouds: mean(slice("cloud_cover")),
      pop: dv("precipitation_probability_max", i) / 100,
      rain: dv("precipitation_sum", i),
      uvi: dv("uv_index_max", i),
    };
  });

  return weatherSchema.parse({
    lat: json.latitude,
    lon: json.longitude,
    timezone: json.timezone,
    timezone_offset: json.utc_offset_seconds,
    current: {
      dt: c.time,
      sunrise: daily[0].sunrise,
      sunset: daily[0].sunset,
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      pressure: c.surface_pressure,
      humidity: c.relative_humidity_2m,
      dew_point: hv("dew_point_2m", start),
      uvi: hv("uv_index", start),
      clouds: c.cloud_cover,
      visibility: hv("visibility", start),
      wind_speed: c.wind_speed_10m,
      wind_deg: c.wind_direction_10m,
      wind_gust: c.wind_gusts_10m,
      weather: condition(c.weather_code, c.is_day === 1),
    },
    hourly: hourly.slice(start, start + 48), // OpenWeather gives 48 hours from now
    daily,
  });
}
export async function getGeocode(location: string) {
  const params = new URLSearchParams({
    name: location,
    count: "5",
    language: "en",
    format: "json",
  });

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
  );
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);

  const raw = OpenMeteoGeocodeResponse.parse(await res.json());

  const mapped = (raw.results ?? []).map((r) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country ?? "",
    state: r.admin1,
  }));

  return GeocodeSchema.parse(mapped);
}

const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const AIR_VARIABLES = [
  "european_aqi",
  "pm10",
  "pm2_5",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
  "ammonia",
];

export async function getAirQuality({
  lat,
  lng: lon,
}: {
  lat: number;
  lng: number;
}): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: AIR_VARIABLES.join(","),
  });

  const res = await fetch(`${AIR_QUALITY_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo air quality request failed: ${res.status}`);
  const json = await res.json();
  const raw = rawAirQualitySchema.parse(json);
  const c = raw.current;

  return airQualitySchema.parse({
    aqi: c.european_aqi ?? null,
    pm2_5: c.pm2_5 ?? null,
    pm10: c.pm10 ?? null,
    o3: c.ozone ?? null,
    no2: c.nitrogen_dioxide ?? null,
    so2: c.sulphur_dioxide ?? null,
    co: c.carbon_monoxide ?? null,
    nh3: c.ammonia ?? null,
  });
}

