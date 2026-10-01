# Atmos

A weather and air-quality dashboard. Search for a city or click anywhere on the map to load the full forecast, with an Open-Meteo air-quality panel, light/dark themes and Celsius/Fahrenheit switching. Built with React and Vite, powered entirely by keyless APIs — **no API key, no backend, no account.**

[![License: MIT](https://img.shields.io/badge/License-MIT-ae3cc9.svg?style=flat-square&labelColor=black)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&labelColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6.svg?style=flat-square&labelColor=black)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?style=flat-square&labelColor=black)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg?style=flat-square&labelColor=black)](https://tailwindcss.com)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-ff4159.svg?style=flat-square&labelColor=black)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/Zod-4-3c6178.svg?style=flat-square&labelColor=black)](https://zod.dev)

## Live demo

**[https://atmos-devbuku.vercel.app](https://atmos-devbuku.vercel.app)**

### Screenshot

No screenshot has been added yet. Save a capture as
`docs/images/screenshot.png`, then replace this paragraph with a Markdown image
whose alt text describes what it shows.

## Features

Everything below is implemented in the current codebase.

- **Search any location** — debounced (250 ms) city/region/country search against the Open-Meteo geocoding API, with full keyboard support (arrow keys, Enter, Escape) and a proper combobox/listbox ARIA pattern.
- **Click-to-load map** — a Leaflet map with standard OpenStreetMap tiles, click anywhere to load that point's forecast. Clicks are debounced (150 ms) and coordinates are snapped to 4 decimal places.
- **Smooth map transitions** — the map flies to new coordinates instead of jumping, while keeping your zoom level.
- **Use my location** — one-click browser geolocation.
- **Shareable URLs** — the selected location is written to `?lat=&lon=&name=`, so a link restores the exact view. It is also remembered in `localStorage` and falls back to Tokyo on first visit.
- **Current conditions** — temperature, condition, feels-like, humidity, wind speed and direction, plus the local time *in the forecast's timezone*.
- **48-hour forecast** — hour-by-hour with a horizontal scroll strip.
- **8-day forecast** — daily highs/lows with proportional temperature range bars and precipitation probability.
- **Air quality panel** — European AQI headline plus per-pollutant cards (PM2.5, PM10, O₃, NO₂, SO₂, CO, NH₃), each with a 5-step severity scale, a concentration bar and a "No data" state.
- **Responsive air-quality presentation** — a sticky sidebar on desktop, a grid on tablet, and a bottom sheet on mobile. All three read from a single cached request.
- **Celsius / Fahrenheit toggle** — including wind speed, which converts to mph.
- **Light and dark themes** — persisted, respects your OS preference, and applied before first paint so there is no flash.
- **Per-card loading skeletons** that match the real card layout.
- **Per-card error boundaries** that classify the failure (network, rate-limited, bad payload) and offer a retry.
- **Offline banner** — detects connectivity loss and warns that data may be stale.
- **Installable web app manifest** and Open Graph/Twitter metadata for link previews.
- **Accessible by construction** — labelled regions, live regions, visible focus rings, and 44 px minimum touch targets.

## Tech stack

| Library | Why it's here |
| --- | --- |
| [React 19](https://react.dev) + TypeScript 6 | UI runtime and static types for the whole data layer. |
| [Vite 8](https://vite.dev) | Dev server, code splitting (the map is a lazy chunk) and the production build. |
| [@tanstack/react-query 5](https://tanstack.com/query) | Server-state caching, request deduplication and retry policy, so four cards share one request. |
| [Zod 4](https://zod.dev) | Runtime validation of every API response and a single source of truth for response types. |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling via the `@tailwindcss/vite` plugin — no `tailwind.config` file. |
| [Leaflet](https://leafletjs.com) | Interactive map with click handling and animated view changes. |
| [react-leaflet 5](https://react-leaflet.js.org) | React bindings for Leaflet. ⚠️ Pinned to `5.0.0-rc.2`, a **release candidate** licensed under Hippocratic-2.1 (see [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)). |
| [lucide-react](https://lucide.dev) | Icon set for the interface chrome. |
| [cn](https://github.com/shadcn-ui/cn) | Compiled `clsx` + `tailwind-merge` replacement used for class composition. |
| [clsx](https://github.com/lukeed/clsx) | Lightweight conditional class names. |
| [class-variance-authority](https://cva.style) | Variant API for the shadcn button component. |
| [@base-ui/react](https://base-ui.com) | Unstyled primitives behind the `src/components/ui` shadcn components. |
| [shadcn/ui](https://ui.shadcn.com) | `base-nova` style configuration for the components in `src/components/ui`. |
| [@fontsource-variable/geist](https://fontsource.org/fonts/geist) | Self-hosted Geist variable font — no external font CDN request. |
| [tw-animate-css](https://tw-animate-css.vercel.app) | Tailwind animation utilities used for enter transitions. |

> **Note on two declared dependencies.** The `openmeteo` npm SDK is listed in
> `package.json` but is **not imported anywhere** — all requests use `fetch`
> directly. The generated `src/components/ui/select.tsx` and
> `ui/button.tsx` are currently unused by the app. Neither is required to run it.

## Data sources and APIs

All data comes from **[Open-Meteo](https://open-meteo.com)**, which requires
**no API key** and no signup. Three endpoints are used, all called from
`src/api.ts`:

| Endpoint | Used for |
| --- | --- |
| `api.open-meteo.com/v1/forecast` | Current conditions, 48 hours and 8 days of forecast. |
| `geocoding-api.open-meteo.com/v1/search` | Turning a typed place name into coordinates. |
| `air-quality-api.open-meteo.com/v1/air-quality` | European AQI and pollutant concentrations. |

Map tiles come from the OpenStreetMap standard tile servers. No API key or account is required for either the tiles or the weather data.

### How data flows

```
Open-Meteo HTTP  →  src/api.ts  →  Zod parse  →  TanStack Query cache  →  components
   raw JSON         reshape to       validate      one entry per          render
                     our shape                       rounded coords
```

`src/api.ts` is the only module that performs network requests. It reshapes
each response into an internal, stable shape and hands it to a Zod schema, so a
malformed payload throws at the boundary instead of silently producing `NaN`
somewhere in the UI.

Because all four weather cards call the same `useWeather(coords)` hook with
the same rounded coordinates, TanStack Query collapses them into **one** cache
entry and **one** HTTP request. The air-quality panel is rendered three times
across breakpoints and costs one request for the same reason.

The detailed endpoint parameters, the field-by-field mapping, and the WMO
weather-code table are documented in [docs/API.md](docs/API.md).

## Getting started

### Prerequisites

- **Node.js `^20.19.0` or `>=22.12.0`** — the floor imposed by Vite 8 (verified on
  Node 24.21)
- **npm 10 or newer** (bundled with Node)

### Clone and install

```sh
git clone https://github.com/devbuku/atmos.git
cd atmos
npm install
```

### Available scripts

These are the scripts defined in `package.json`:

| Script | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite development server with hot module replacement. |
| `npm run build` | Type-checks with `tsc -b`, then builds for production into `dist/`. |
| `npm run lint` | Runs ESLint across the project. |
| `npm run preview` | Serves the production build locally to check it before deploying. |

Typical first run:

```sh
npm install
npm run dev      # prints http://localhost:5173 (or the next free port)
```

Before opening a pull request, run both checks — they are the entire CI suite:

```sh
npm run lint
npm run build
```

> There is currently **no automated test suite and no CI workflow**. `npm run build`
> performs the type-check (`tsc -b`), so lint + build is the full verification
> story. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Project structure

```
atmos/
├── docs/                       # Design decisions, architecture, API and dev notes
├── public/                     # Copied verbatim to the site root
│   ├── favicon.svg             # Site icon (also used by manifest.json)
│   ├── icons.svg               # Unused sprite sheet
│   └── manifest.json           # Web app manifest
├── src/
│   ├── assets/
│   │   └── weather-icons/      # Vendored icon font (see THIRD_PARTY_LICENSES.md)
│   ├── components/
│   │   ├── cards/              # CurrentWeather, HourlyForecast, DailyForecast, AdditionalInfo
│   │   │                       #   + the shared Card shell and Skeletons
│   │   ├── ui/                 # shadcn/ui generated components (currently unused)
│   │   ├── AirQualityPanel.tsx # AQI headline + per-pollutant cards
│   │   ├── CardErrorBoundary.tsx
│   │   ├── Header.tsx          # Sticky top bar: search, unit + theme toggles, AQI
│   │   ├── LocationCombobox.tsx# Debounced search with geolocation
│   │   ├── Map.tsx             # Leaflet map, custom marker, flyTo
│   │   ├── MobileAirQualitySheet.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── UnitToggle.tsx
│   │   └── WeatherIcon.tsx     # WMO code -> icon font glyph
│   ├── constants/
│   │   └── airQuality.ts       # European AQI bands and pollutant thresholds
│   ├── context/                # Theme and unit providers + their hooks
│   ├── hooks/
│   │   ├── useAirQuality.ts    # The only air-quality query entrypoint
│   │   └── useWeather.ts       # The only weather query entrypoint
│   ├── lib/
│   │   ├── formatters.ts       # Unit conversion, compass points, timezone formatting
│   │   └── utils.ts            # `cn` re-export + coordinate rounding
│   ├── schemas/                # Zod schemas for weather, air quality and geocoding
│   ├── api.ts                  # The only module that talks to the network
│   ├── App.tsx                 # Layout, location state, Suspense boundaries
│   ├── main.tsx                # React root, QueryClient, providers
│   ├── types.ts                # Shared `Coords` type
│   └── index.css               # Tailwind entry + design tokens
├── AGENTS.md                   # Notes for AI coding agents working in this repo
├── components.json             # shadcn/ui configuration
└── vite.config.ts
```

## Environment variables

**None.** Atmos requires no environment variables, API keys, secrets or `.env`
files. Every upstream API it uses is public and keyless, and the application is
entirely client-side.

If you fork this project, you do not need to create a `.env` file.

## Deployment

Atmos is a static single-page application. There is no server, no database and
no build-time secret to configure.

### Vercel (recommended)

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). Vercel detects Vite automatically.
3. Accept the detected settings — **Framework Preset: Vite**, `npm run build`, output directory `dist`.
4. Click **Deploy**.

No environment variables are required. Because browser geolocation needs a
secure context, the HTTPS certificate Vercel provides by default is also what
makes the "use my location" button work in production.

### Any other static host

Build locally and publish the `dist/` directory:

```sh
npm run build     # emits dist/
```

`dist/` is a fully static bundle. Serve it from any static host (GitHub Pages,
Netlify, Cloudflare Pages, S3 + CloudFront, nginx). Two things to configure:

- **SPA fallback** — rewrite unknown paths to `/index.html`. Atmos uses query
  parameters rather than client-side routes, so this only matters if you add
  routing later.
- **HTTPS** — required for geolocation outside `localhost`.

## Known limitations and possible next steps

Deliberately absent from the current code:

- **No weather overlay on the map.** The basemap is a plain OpenStreetMap tile layer; there is no precipitation, cloud or temperature overlay.
- **Dark mode inverts the map tiles.** OSM serves a single light style, so `.dark` applies a CSS `invert()`/`hue-rotate()` filter to `.leaflet-tile-pane`. Labels stay legible but the palette is not a purpose-designed dark basemap.
- **Air quality is current-conditions only.** `src/api.ts` requests only the `current` block from the air-quality endpoint, so there is no AQI forecast or history chart.
- **AQI is European, not US EPA.** The headline number is Open-Meteo's `european_aqi` with WHO µg/m³ thresholds. It is not comparable to a US EPA AQI reading without conversion.
- **No automated tests and no CI.** Verification is `npm run lint` plus `npm run build`.
- **`react-leaflet` is a release candidate** (`5.0.0-rc.2`). Its API may change before 5.0.0 is stable.
- **No reverse geocoding.** Clicking the map labels the point `Custom location (lat, lng)` rather than resolving a nearby place name.
- **No offline caching.** `OfflineBanner` warns you that data may be stale, but there is no service worker or cache-first layer, so a cold load while offline will fail.
- **No PWA service worker.** `manifest.json` exists, but nothing registers a worker, so the manifest only enables "add to home screen".
- **Unused scaffolding.** `src/components/ui/select.tsx`, `ui/button.tsx`, `public/icons.svg`, and `src/assets/{hero.png,react.svg,vite.svg}` are not referenced by the app and can be deleted. The `openmeteo` dependency is likewise unused.
- **`<body>`/`:root` CSS custom properties** inherited from the Geist template (`--social-bg`, `--accent`) are still defined in `src/index.css` and are not used by any component.
- **`.custom-map-marker` and `.custom-leaflet-popup`** are applied as class hooks in `Map.tsx` but have no rules in `index.css`.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first —
it covers branching, commit message style, the checks to run and how to open a
pull request. Participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

Released under the [MIT License](LICENSE). © 2026 Shubhayan Bagchi

## Acknowledgements and credits

### Data

- **[Open-Meteo](https://open-meteo.com)** — all weather, geocoding and air-quality data. Free, keyless, and licensed under **CC BY 4.0**. Attribution is displayed in the app footer. Thank you to the Open-Meteo team for making this data freely accessible.
- **[OpenStreetMap contributors](https://www.openstreetmap.org/copyright)** — map data, © OpenStreetMap contributors, licensed under the **Open Database License (ODbL)**. Attribution is rendered in the map's tile attribution control and in the app footer.
- **[OpenStreetMap standard tile servers](https://operations.osmfoundation.org/policies/tiles/)** — raster basemap tiles from `tile.openstreetmap.org`, funded by donations and sponsorship. Attribution is shown in the map's attribution control. Use is subject to the OSM [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/), which prohibits bulk downloading and offline tile prefetch.

### Icons and fonts

- **[Weather Icons](https://erikflowers.github.io/weather-icons/)** by **Erik Flowers** — vendored in `src/assets/weather-icons/`. The **icon font is licensed under SIL OFL 1.1**; the accompanying **CSS/SCSS/LESS is MIT**; documentation is CC BY 3.0. Inspired by Font Awesome by Dave Gandy.
- **[Geist](https://vercel.com/fonts)** by **Vercel** — the variable font used for the interface, © The Geist Project Authors, licensed under the **SIL Open Font License 1.1**, self-hosted via `@fontsource-variable/geist`.
- **[Lucide](https://lucide.dev)** — interface icons, ISC licensed.

### Design inspiration

- **[AustinDavisTech/WeatherApp](https://github.com/AustinDavisTech/WeatherApp)** — the dashboard layout and card-based presentation were informed by this project as **visual and UX design inspiration only**. No source code, markup or assets were copied from it.

### Libraries

React, Vite, TanStack Query, Zod, Tailwind CSS, Leaflet, react-leaflet, lucide-react, `cn`, `clsx`, `class-variance-authority`, `@base-ui/react`, shadcn/ui, `tw-animate-css` and ESLint are used under their own licenses. The full inventory with license identifiers is in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

### Documentation

- **[Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)** — basis for this project's Code of Conduct.
