# AGENTS.md

## Commands
- `npm run dev` — Vite dev server. `npm run preview` — serve the build.
- `npm run build` — `tsc -b && vite build`. This is **also** the typecheck; there is no separate typecheck script.
- `npm run lint` — `eslint .` (flat config, `eslint.config.js`).
- **No tests, no CI, no Prettier, no `.env*`.** Verify with `npm run lint && npm run build`.

## Baseline: lint and build PASS
The map-type dropdown and props have been removed. Both `npm run lint` and `npm run build` pass cleanly.

## Architecture
- `src/api.ts` is the only network layer: raw `fetch` to **Open-Meteo** (keyless). It reshapes the response into an OpenWeather One Call–style shape validated by `weatherSchema.parse()` in `src/schemas/weatherSchema.ts` — a mismatch **throws**, it doesn't degrade.
- The `openmeteo` npm package is installed but **never imported**. Don't reach for the SDK.
- `src/hooks/useWeather.ts` is the *only* weather query entrypoint (`queryKey: ["weather", coords]`). Calling `useSuspenseQuery` directly anywhere else splits the cache and doubles the network request.
- Location resolution in `App`: `mapCoords` (last map click) → geocode result → `{ lat: 10, lng: 10 }`.
- `<Suspense>` wraps exactly the four cards; **`Map` sits outside it deliberately** — remounting `MapContainer` would rebuild the Leaflet map and discard the user's zoom/pan. Don't move it in.
- The geocode query uses `placeholderData: (previous) => previous` and takes `geoCodeData[0]` of the 5 returned results. There is no result-picker UI; `LocationDropdown` is a hardcoded 10-city list, not a search box.
- README.md has a "Decisions" section recording the props-vs-context and Suspense-boundary reasoning — read it before changing the component tree.

## Adding a weather field
Four places, not three: the `CURRENT`/`HOURLY`/`DAILY` variable lists and the mapping in `src/api.ts`, then `weatherSchema.ts`. Separately, there are **two** WMO-code tables that must stay in sync — `WMO` in `api.ts` (emits an OpenWeather-style `icon` string) and `WMO_ICONS` in `WeatherIcon.tsx` (the actual `wi-*` classes). Night-vs-day is carried as `icon.endsWith("n")`.

Conventions in the data: timestamps are Unix **seconds** (multiply by 1000 to display), `precipitation_probability` is normalized to `pop` 0..1, wind is m/s (`wind_speed_unit=ms`).

## Gotchas
- **`cn` is a real npm package** (shadcn-ui's compiled clsx + tailwind-merge replacement). `src/lib/utils.ts` just re-exports it — do **not** rewrite it as the classic `clsx`/`twMerge` snippet. Note `ui/button.tsx` and `ui/select.tsx` import `cn` from `"cn"` directly, bypassing `lib/utils`. `clsx` is still used raw in `WeatherIcon.tsx` and `AdditionalInfo.tsx`.
- **The `wi-*` font CSS is imported in exactly one place**: `WeatherIcon.tsx` pulls `../assets/weather-icons/css/weather-icons.css`. `AdditionalInfo.tsx` emits raw `wi-*` classes *without* importing it — it only renders correctly because a `WeatherIcon` mounts elsewhere in the same tree. Treat all of `src/assets/weather-icons/` as vendored third-party (fonts, less/sass, docs, builder scripts) — don't edit it.
- **The app is hardcoded dark**: `<body class="dark">` in `index.html`. The `.dark` block in `src/index.css` is the live theme; the `:root` oklch tokens are inert. The `@media (prefers-color-scheme: dark)` block only overrides the non-oklch vars.
- Tailwind v4 — no `tailwind.config`. Tokens are the `@theme inline` block in `src/index.css`. `src/components/ui/*` are shadcn-generated (`components.json`, style `base-nova`, base-ui primitives) — follow their conventions rather than hand-rolling.
- Leaflet CSS is imported from *inside* `src/components/Map.tsx` (`leaflet/dist/leaflet.css`). `MapContainer`'s `center` prop only sets the initial view; `MapController` calls `map.setView()` in an effect. `react-leaflet` is pinned to `5.0.0-rc.2` — an RC, so v4 docs online may not apply.
- `MapTypeDropdown`'s values are OpenWeather-style layer ids, but `Map` hardcodes its `TileLayer` to OpenStreetMap — switching layers currently does nothing.
- `"Bankok"` is a typo in `LocationDropdown`. It doesn't 404; it geocodes to **"Ban Ko, Thailand"**. Verified against the live API.
- The `@/` alias is configured in both `vite.config.ts` and `tsconfig.app.json` but **unused** — every import under `src/` is relative. Only `main.tsx` uses an explicit extension (`./App.tsx`, permitted by `allowImportingTsExtensions`). Neither convention is enforced; match neighbouring files.
- tsconfig.app.json sets `verbatimModuleSyntax` (`import type`), `erasableSyntaxOnly` (no enums/namespaces), and `noUnusedLocals`/`noUnusedParameters`.
- Dead weight: `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`.
