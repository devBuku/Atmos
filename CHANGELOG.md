# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.0.0] - 2026-10-01

Initial public release.

### Added

- **Location selection**
  - Debounced city/region/country search against the Open-Meteo geocoding API,
    with keyboard navigation and ARIA combobox semantics.
  - "Use my location" via the browser Geolocation API.
  - Shareable URLs: the active location is serialised to `?lat=&lon=&name=`.
  - Location persistence in `localStorage`, falling back to Tokyo.
- **Map**
  - Leaflet map with a click-to-select location interaction, debounced at
    150 ms and snapped to 4 decimal places.
  - CARTO light and dark basemaps that follow the active theme.
  - Animated `flyTo` transitions that preserve the user's zoom level.
  - Accessible custom marker with a pulsing indicator.
  - Lazy-loaded as a separate chunk so Leaflet stays out of the main bundle.
- **Forecasts**
  - Current conditions: temperature, condition, feels-like, humidity, wind
    speed and direction, and local time in the forecast's timezone.
  - 48-hour hourly forecast strip.
  - 8-day daily forecast with proportional temperature range bars and
    precipitation probability.
  - Additional conditions: cloudiness, UV index, wind direction, pressure,
    sunrise and sunset.
- **Air quality**
  - European AQI headline band.
  - Per-pollutant cards for PM2.5, PM10, O₃, NO₂, SO₂, CO and NH₃, each with a
    5-step severity scale, concentration bar and null-safe "No data" state.
  - Responsive presentation: sticky sidebar on desktop, grid on tablet, bottom
    sheet on mobile — all served from a single request.
- **Interface**
  - Light and dark themes, persisted, OS-aware, applied pre-paint to avoid
    flash of incorrect theme.
  - Celsius/Fahrenheit toggle including wind speed conversion.
  - Sticky header, offline banner, and a web app manifest.
  - Loading skeletons matched to each card's real layout.
  - Per-card error boundaries that classify network, rate-limit and payload
    errors and offer retry.
  - Open Graph and Twitter Card metadata.
- **Data layer**
  - `src/api.ts` as the single network module, wrapping the Open-Meteo
    forecast, geocoding and air-quality endpoints with `fetch`.
  - Response reshaping into a stable OpenWeather One Call–style shape.
  - Zod validation at the API boundary for weather, air quality and geocoding.
  - TanStack Query caching with coordinate rounding, stale/gc timeouts, and a
    retry policy that never retries `4xx` responses.

### Notes

- Requires no API key, environment variables or backend.
- Weather Icons by Erik Flowers is vendored under `src/assets/weather-icons/`.
- Map data © OpenStreetMap contributors (ODbL); basemap tiles © CARTO;
  weather and air-quality data by Open-Meteo (CC BY 4.0).

[Unreleased]: https://github.com/devbuku/atmos/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/devbuku/atmos/releases/tag/v0.0.0
