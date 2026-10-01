# AGENTS.md

## Commands
- `npm run dev` — Vite dev server. `npm run preview` — serve the build.
- `npm run build` — `tsc -b && vite build`. This is **also** the typecheck; there is no separate typecheck script.
- `npm run lint` — `eslint .` (flat config, `eslint.config.js`).
- **No tests, no CI, no Prettier, no `.env*`.** Verify with `npm run lint && npm run build` — both are green on `main`.

## Data flow
- `src/api.ts` is the only network layer: raw `fetch` to **Open-Meteo** (keyless). Three endpoints — weather, geocoding, air quality. The `openmeteo` npm package is installed but **never imported**; don't reach for the SDK.
- Responses are reshaped into an OpenWeather One Call–style shape validated by `weatherSchema.parse()` / `airQualitySchema.parse()` at the boundary — a mismatch **throws** rather than degrading.
- **Weather and air quality use deliberately different strategies.** Weather goes through `useSuspenseQuery` in `src/hooks/useWeather.ts`; callers sit under `<Suspense>` inside a `CardErrorBoundary`, with per-card skeletons from `components/cards/Skeletons.tsx`. Air quality uses plain `useQuery` in `src/hooks/useAirQuality.ts` and renders its own loading/error states inline. Don't unify them without a reason.
- **Both hooks are the only sanctioned query entrypoints** — `queryKey: ["weather"|"air", roundedCoords]`. `AirQualityPanel` is rendered three times for the xl/tablet/mobile breakpoints and `App` calls `useAirQuality` for the header badge; they all share one cache entry only because nobody calls `useQuery` directly. Do that again and you multiply requests.
- `roundCoords` (`src/lib/utils.ts`) quantizes lat/lng to 2 decimals **before** building the key and before fetching — that's what collapses near-identical clicks into one cache entry. Preserve it.
- Units are a **display-only** concern. The API request never sends a unit preference, so the wire is always °C and m/s (`wind_speed_unit=ms`); conversion happens at render in `src/lib/formatters.ts` via `useUnit()`. Don't add unit params to the fetch.
- Other data conventions: timestamps are Unix **seconds** (×1000 to display), `precipitation_probability` is normalized to `pop` 0..1.

## Location state
`App` owns it, in priority order: URL query params (`lat` + `lon` or `lng` + `name`) → `localStorage["atmos_last_location"]` → Tokyo. Every change writes back to both via `history.replaceState` and localStorage. Map clicks are debounced 150ms and rounded to 4dp.
- Location flows down as **props**; theme and unit are **Context**. These are separate decisions — `README.md`'s "Decisions" section argues props-over-context specifically for location and still governs it. Read it before reshaping the tree.
- The `<Suspense>` boundaries wrap the four weather cards only; **`Map` is outside them (with its own boundary and `MapPlaceholder`)** — remounting `MapContainer` would discard the user's zoom and pan. `Map` is also `lazy()`, which is why Leaflet gets its own chunk.

## Adding a weather field
Four places: the `CURRENT`/`HOURLY`/`DAILY` variable lists in `src/api.ts`, the mapping in `getWeather`, then `src/schemas/weatherSchema.ts`. Separately, **two** WMO-code tables must stay in sync — `WMO` in `api.ts` (emits an OpenWeather-style `icon` string) and `WMO_ICONS` in `WeatherIcon.tsx` (the actual `wi-*` classes). Day-vs-night is carried as `icon.endsWith("n")`.

## Gotchas
- **Theme is dynamic, and there's a no-FOUC inline script.** `index.html` toggles `.dark` on `documentElement` before any CSS loads; `context/ThemeProvider.tsx` then keeps `.dark` on *both* `html` and `body` and persists to `localStorage["atmos_theme"]`. `Map` reads `useTheme()` to swap CARTO light/dark tiles. The `.dark` block in `src/index.css` is live — `:root` holds the light values.
- Air quality uses the **European AQI** (0–100+, `european_aqi`) with WHO µg/m³ thresholds in `src/constants/airQuality.ts` — not US AQI. Bands and per-pollutant thresholds live there, not inline in the panel.
- **AQI is nullable throughout.** The schema allows nulls, `getEAQIBand(null)` returns a synthetic "No data" band, and `nh3` is omitted from the panel when null. Guard new code against null rather than assuming a number.
- **`cn` is a real npm package** (shadcn-ui's compiled clsx + tailwind-merge replacement). `src/lib/utils.ts` re-exports it plus `roundCoords` — do **not** rewrite `cn` as the classic `clsx`/`twMerge` snippet. Import paths are inconsistent by design of the generator: `ui/button.tsx` and `ui/select.tsx` pull `cn` from `"cn"` directly, `Card.tsx` goes through `lib/utils`. `clsx` survives in `WeatherIcon.tsx` only.
- **`src/components/ui/select.tsx` and `ui/button.tsx` are dead code** — nothing imports them since the shadcn Select gave way to the hand-rolled `LocationCombobox`. Don't treat them as the app's UI layer.
- The `wi-*` font CSS is imported in exactly one place, `WeatherIcon.tsx`, which is also the only remaining `wi-*` consumer (everything else moved to `lucide-react`). Treat all of `src/assets/weather-icons/` as vendored third-party (fonts, less/sass, docs, builder scripts) — don't edit it.
- Leaflet CSS is imported from *inside* `src/components/Map.tsx`. `MapContainer`'s `center` prop only sets the initial view; `MapController` calls `map.flyTo()` when coords move. `react-leaflet` is pinned to `5.0.0-rc.2` — an RC, so v4 docs online may not apply.
- `vite.config.ts` uses `__dirname`, which emits a build warning under Vite's future-default `configLoader: 'native'`. Use `import.meta.dirname` if you touch it.
- Tailwind v4 — no `tailwind.config`. Tokens are the `@theme inline` block in `src/index.css`. `ui/*` follow shadcn conventions (`components.json`, style `base-nova`, base-ui primitives) even though they're unused.
- The `@/` alias is configured in both `vite.config.ts` and `tsconfig.app.json` but **unused** — every import under `src/` is relative. Only `main.tsx` uses explicit extensions (`./App.tsx`, permitted by `allowImportingTsExtensions`). Neither convention is enforced; match neighbouring files.
- tsconfig.app.json sets `verbatimModuleSyntax` (`import type`), `erasableSyntaxOnly` (no enums/namespaces), and `noUnusedLocals`/`noUnusedParameters`.
- localStorage keys are `atmos_theme`, `atmos_unit`, `atmos_last_location`. `public/manifest.json` is referenced by `index.html`; `public/icons.svg` is not used by anything.
- Dead weight: `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`.
