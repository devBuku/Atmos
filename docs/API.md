# API reference

Every network request in Atmos originates in **`src/api.ts`**. No other module
calls `fetch`.

All three upstream endpoints are part of
[Open-Meteo](https://open-meteo.com) and require **no API key**. Weather and
air-quality data are licensed **CC BY 4.0** and credited in the app footer.

---

## Endpoints used

| # | Endpoint | Function in `src/api.ts` | Consumer |
| --- | --- | --- | --- |
| 1 | `https://api.open-meteo.com/v1/forecast` | `getWeather({ lat, lng })` | `useWeather` → four forecast cards |
| 2 | `https://geocoding-api.open-meteo.com/v1/search` | `getGeocode(name)` | `LocationCombobox` |
| 3 | `https://air-quality-api.open-meteo.com/v1/air-quality` | `getAirQuality({ lat, lng })` | `useAirQuality` → air-quality panel |

---

## 1. Weather forecast

### Request parameters

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=<lat>
  &longitude=<lon>
  &current=<CURRENT joined by ",">
  &hourly=<HOURLY joined by ",">
  &daily=<DAILY joined by ",">
  &timezone=auto
  &timeformat=unixtime
  &wind_speed_unit=ms
  &forecast_days=8
```

| Parameter | Value | Why |
| --- | --- | --- |
| `latitude` / `longitude` | rounded to 2 dp | From `roundCoords()` in `src/lib/utils.ts`, so cache keys and requests agree. |
| `timezone` | `auto` | The response carries an IANA zone name, which is used to render local time correctly. |
| `timeformat` | `unixtime` | Timestamps arrive as Unix **seconds**. Multiply by 1000 before handing to `Date`. |
| `wind_speed_unit` | `ms` | Metres per second. The UI converts to mph when the user picks °F. |
| `forecast_days` | `8` | Daily forecast length. |

> **No unit parameters are sent.** The API is always asked for Celsius and m/s;
> unit conversion is purely a display concern handled in `src/lib/formatters.ts`.

### Requested variables

`current`:

```
temperature_2m, apparent_temperature, relative_humidity_2m, surface_pressure,
cloud_cover, wind_speed_10m, wind_direction_10m, wind_gusts_10m, weather_code,
is_day
```

`hourly`:

```
temperature_2m, apparent_temperature, surface_pressure, relative_humidity_2m,
dew_point_2m, uv_index, cloud_cover, visibility, wind_speed_10m,
wind_direction_10m, wind_gusts_10m, weather_code, is_day,
precipitation_probability
```

`daily`:

```
sunrise, sunset, weather_code, temperature_2m_max, temperature_2m_min,
precipitation_sum, precipitation_probability_max, uv_index_max,
wind_speed_10m_max, wind_gusts_10m_max, wind_direction_10m_dominant
```

### Response → internal shape

Open-Meteo returns parallel arrays indexed by time. `getWeather` converts them
into records and renames fields to match an
**OpenWeather One Call–style** shape, validated by
[`weatherSchema`](../src/schemas/weatherSchema.ts).

| Internal path | Source | Notes |
| --- | --- | --- |
| `lat`, `lon` | `latitude`, `longitude` | Coordinates as returned (the grid point, not the request). |
| `timezone` | `timezone` | IANA name, e.g. `Asia/Tokyo`. Used for all local-time rendering. |
| `timezone_offset` | `utc_offset_seconds` | |
| `current.dt` | `current.time` | Unix seconds. |
| `current.temp` | `current.temperature_2m` | |
| `current.feels_like` | `current.apparent_temperature` | |
| `current.pressure` | `current.surface_pressure` | hPa. |
| `current.humidity` | `current.relative_humidity_2m` | %. |
| `current.clouds` | `current.cloud_cover` | %. |
| `current.wind_speed` / `wind_deg` / `wind_gust` | `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m` | |
| `current.dew_point`, `current.uvi`, `current.visibility` | hourly arrays at the current hour | Interpolated from `hourly`, not present in `current`. |
| `current.sunrise`, `current.sunset` | `daily[0]` | |
| `current.weather[0]` | `WMO[weather_code]` + `is_day` | See the table below. |
| `hourly[]` | `hourly` arrays, **sliced from the current hour, 48 entries** | |
| `hourly[].pop` | `precipitation_probability / 100` | **Normalized to 0–1**, not percent. |
| `daily[]` | `daily` arrays | All 8 days. |
| `daily[].temp.day/night/eve/morn` | hourly at index `day*24 + 12 / 0 / 18 / 6` | Open-Meteo has no "feels like daily", so it is sampled from hourly. |
| `daily[].feels_like.*` | `apparent_temperature` at the same offsets | |
| `daily[].pressure/humidity/dew_point/clouds` | **mean** of the day's 24 hourly values | |
| `daily[].pop` | `precipitation_probability_max / 100` | |
| `daily[].rain` | `precipitation_sum` | mm. |
| `daily[].wind_speed/wind_deg/wind_gust` | `wind_speed_10m_max`, `wind_direction_10m_dominant`, `wind_gusts_10m_max` | |

Missing numeric values in a series are coerced to `0` rather than `null`, so
components never have to null-check. Unknown weather codes fall back to
`["Clouds", "unknown", "04"]`.

---

## 2. Geocoding

### Request parameters

```
GET https://geocoding-api.open-meteo.com/v1/search
  ?name=<query>
  &count=5
  &language=en
  &format=json
```

The query is debounced by 250 ms in `LocationCombobox` and only fires at 2 or
more characters. The result is cached for one hour via that component's query
options.

### Response → internal shape

Validated first by `OpenMeteoGeocodeResponse`, then mapped and validated again
by `GeocodeSchema`
([`src/schemas/geoCodeSchema.ts`](../src/schemas/geoCodeSchema.ts)).

| Internal | Source |
| --- | --- |
| `name` | `name` |
| `lat` | `latitude` |
| `lon` | `longitude` |
| `country` | `country`, defaulting to `""` |
| `state` | `admin1` (optional) |

`results` is **optional** in the schema: when there are no matches, Open-Meteo
omits the key entirely rather than returning an empty array. `LocationCombobox`
renders "No locations found for …" in that case.

---

## 3. Air quality

### Request parameters

```
GET https://air-quality-api.open-meteo.com/v1/air-quality
  ?latitude=<lat>
  &longitude=<lon>
  &current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia
```

Only the `current` block is requested — there is **no AQI forecast or history**.

### Response → internal shape

Validated by `rawAirQualitySchema`, mapped, then validated by
`airQualitySchema`
([`src/schemas/airQualitySchema.ts`](../src/schemas/airQualitySchema.ts)).

| Internal | Source |
| --- | --- |
| `aqi` | `european_aqi` |
| `pm2_5` / `pm10` | `pm2_5` / `pm10` |
| `o3` | `ozone` |
| `no2` | `nitrogen_dioxide` |
| `so2` | `sulphur_dioxide` |
| `co` | `carbon_monoxide` |
| `nh3` | `ammonia` |

**Every field is nullable.** The UI must handle missing data: `getEAQIBand(null)`
returns a synthetic "No data" band, and the panel omits NH₃ entirely when it is
`null`.

`aqi` is the **European AQI** (European Environment Agency scale), with WHO
µg/m³ thresholds defined in
[`src/constants/airQuality.ts`](../src/constants/airQuality.ts). It is *not* a
US EPA AQI reading.

---

## WMO weather code mapping

Open-Meteo reports a numeric WMO code. Two lookup tables convert it, and **both
must be updated together** when adding a code:

- `WMO` in [`src/api.ts`](../src/api.ts) — produces `main`, `description` and an
  OpenWeather-style icon id suffixed `d` or `n` from `is_day`.
- `WMO_ICONS` in
  [`src/components/WeatherIcon.tsx`](../src/components/WeatherIcon.tsx) — maps
  the same code to actual Weather Icons font classes.

Components detect night via `weather[0].icon.endsWith("n")`.

| Code | Main | Description | Icon id (day / night) | Day glyph | Night glyph |
| --- | --- | --- | --- | --- | --- |
| 0 | Clear | clear sky | `01d` / `01n` | `wi-day-sunny` | `wi-night-clear` |
| 1 | Clear | mainly clear | `02d` / `02n` | `wi-day-sunny-overcast` | `wi-night-alt-partly-cloudy` |
| 2 | Clouds | partly cloudy | `03d` / `03n` | `wi-day-cloudy` | `wi-night-alt-cloudy` |
| 3 | Clouds | overcast clouds | `04d` / `04n` | `wi-cloudy` | `wi-cloudy` |
| 45 | Fog | fog | `50d` / `50n` | `wi-day-fog` | `wi-night-fog` |
| 48 | Fog | rime fog | `50d` / `50n` | `wi-day-fog` | `wi-night-fog` |
| 51 | Drizzle | light drizzle | `09d` / `09n` | `wi-day-sprinkle` | `wi-night-alt-sprinkle` |
| 53 | Drizzle | moderate drizzle | `09d` / `09n` | `wi-day-sprinkle` | `wi-night-alt-sprinkle` |
| 55 | Drizzle | dense drizzle | `09d` / `09n` | `wi-day-sprinkle` | `wi-night-alt-sprinkle` |
| 56 | Drizzle | freezing drizzle | `09d` / `09n` | `wi-day-rain-mix` | `wi-night-alt-rain-mix` |
| 57 | Drizzle | heavy freezing drizzle | `09d` / `09n` | `wi-day-rain-mix` | `wi-night-alt-rain-mix` |
| 61 | Rain | light rain | `10d` / `10n` | `wi-day-rain` | `wi-night-alt-rain` |
| 63 | Rain | moderate rain | `10d` / `10n` | `wi-day-rain` | `wi-night-alt-rain` |
| 65 | Rain | heavy rain | `10d` / `10n` | `wi-rain` | `wi-rain` |
| 66 | Rain | freezing rain | `10d` / `10n` | `wi-day-sleet` | `wi-night-alt-sleet` |
| 67 | Rain | heavy freezing rain | `10d` / `10n` | `wi-day-sleet` | `wi-night-alt-sleet` |
| 71 | Snow | light snow | `13d` / `13n` | `wi-day-snow` | `wi-night-alt-snow` |
| 73 | Snow | moderate snow | `13d` / `13n` | `wi-day-snow` | `wi-night-alt-snow` |
| 75 | Snow | heavy snow | `13d` / `13n` | `wi-day-snow` | `wi-night-alt-snow` |
| 77 | Snow | snow grains | `13d` / `13n` | `wi-day-snow` | `wi-night-alt-snow` |
| 80 | Rain | light rain showers | `09d` / `09n` | `wi-day-showers` | `wi-night-alt-showers` |
| 81 | Rain | moderate rain showers | `09d` / `09n` | `wi-day-showers` | `wi-night-alt-showers` |
| 82 | Rain | violent rain showers | `09d` / `09n` | `wi-storm-showers` | `wi-storm-showers` |
| 85 | Snow | light snow showers | `13d` / `13n` | `wi-day-snow` | `wi-night-alt-snow` |
| 86 | Snow | heavy snow showers | `13d` / `13n` | `wi-day-snow` | `wi-night-alt-snow` |
| 95 | Thunderstorm | thunderstorm | `11d` / `11n` | `wi-day-thunderstorm` | `wi-night-alt-thunderstorm` |
| 96 | Thunderstorm | thunderstorm with hail | `11d` / `11n` | `wi-day-thunderstorm` | `wi-night-alt-thunderstorm` |
| 99 | Thunderstorm | thunderstorm with heavy hail | `11d` / `11n` | `wi-day-thunderstorm` | `wi-night-alt-thunderstorm` |

**Fallbacks.** An unmapped code becomes `["Clouds", "unknown", "04"]` and
`wi-na` / `wi-na`.

**Known gaps.** WMO codes 4 (fog, trending), 56–57 (freezing drizzle) and
82 (violent showers) reuse neighbouring glyphs; 85/86 (snow showers) reuse the
plain snow glyph.

---

## Map tiles

Not an HTTP API Atmos calls directly, but part of the network contract:

| Provider | URL template | Terms |
| --- | --- | --- |
| CARTO (dark) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | CARTO Basemap ToU; © CARTO / © OpenStreetMap contributors |
| CARTO (light) | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` | as above |

Subdomains `a`–`d`, `maxZoom` 19. The theme is chosen by
`useTheme()` inside `Map.tsx`. Attribution for both CARTO and OpenStreetMap is
rendered in the Leaflet attribution control.
