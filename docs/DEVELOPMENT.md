# Development guide

## Requirements

- **Node.js `^20.19.0` or `>=22.12.0`** — the floor required by Vite 8.
  Verified on Node 24.21.
- **npm 10 or newer** (bundled with Node)

Check your version:

```sh
node --version
npm --version
```

## Setup

```sh
git clone https://github.com/devbuku/atmos.git
cd atmos
npm install
npm run dev
```

Vite prints the URL it bound to — normally `http://localhost:5173`, or the next
free port if 5173 is taken.

**There is no `.env` file.** Do not create one. Every upstream API is public and
keyless; adding a secret to this repository would publish it, because the app is
a static bundle.

## Scripts

These are the four scripts defined in `package.json`.

| Script | Command | What it does |
| --- | --- | --- |
| `npm run dev` | `vite` | Dev server with hot module replacement. |
| `npm run build` | `tsc -b && vite build` | Type-checks, then builds to `dist/`. |
| `npm run lint` | `eslint .` | Lints the whole project. |
| `npm run preview` | `vite preview` | Serves the production build locally. |

> **`npm run build` is also the type-check.** There is no separate `typecheck`
> script, and running `vite build` alone will **not** catch type errors.

There is no test script, no test runner and no CI. `npm run lint && npm run
build` is the complete verification suite. Both must pass before a pull request
is reviewable.

```sh
npm run lint && npm run build
```

## Code style

### TypeScript

`tsconfig.app.json` sets several options that will reject otherwise-valid code.
These are not stylistic preferences:

| Option | Effect on you |
| --- | --- |
| `verbatimModuleSyntax` | Type-only imports must use `import type { Foo } from ...`. A plain `import { Foo }` of a type is an error. |
| `erasableSyntaxOnly` | No `enum` and no `namespace`. Use `as const` objects or union types. |
| `noUnusedLocals` | Unused variables and imports are errors, including unused catch bindings. |
| `noUnusedParameters` | Unused parameters are errors. Prefix with `_` only if the linter is configured to allow it — it currently is **not**, so remove the parameter instead. |
| `strict` | Null checks everywhere. Air-quality fields are nullable; guard them. |

### Formatting

There is **no Prettier config and no formatting automation.** Match the file you
are editing: two-space indent, double quotes, semicolons. The generated files
in `src/components/ui/` use no semicolons — leave them as generated so a future
`shadcn` re-generation produces a clean diff.

### Comments

Comment the **why**, never the **what**. Design rationale belongs in
[`docs/DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md), not in the source. Do not
comment out code — delete it and rely on git history.

The only comments that belong in source are functionally required ones:
`eslint-disable` directives, `@ts-expect-error`, and `/// <reference />`.

### Do not edit

`src/assets/weather-icons/` is vendored third-party code, complete with its own
Less/Sass sources, documentation and build scripts. Never edit it and never let
a tool reformat it. If you need a different glyph, extend the lookup table in
`src/components/WeatherIcon.tsx` instead.

## Project conventions you need to know

These are the rules that are easy to break by accident.

### Read data through the two hooks, never `useQuery` directly

```ts
const weather = useWeather(coords);       // useSuspenseQuery, key ["weather", roundedCoords]
const air = useAirQuality(coords);        // useQuery, key ["air", roundedCoords]
```

Four cards and three air-quality panels all subscribe to the *same* key, so one
user interaction produces one HTTP request. Calling `useQuery` from a component
creates a second cache entry and a second request. This is the single most
important rule in the codebase.

### Only `src/api.ts` touches the network

All `fetch` calls live in `src/api.ts`. Do not add `fetch` to a component or a
hook. If you need a new field, extend the existing endpoint call rather than
calling a new one.

### Units are a display concern

The API is always asked for Celsius and m/s, and it never receives a unit
parameter. Convert at render through the helpers in
[`src/lib/formatters.ts`](../src/lib/formatters.ts) using `useUnit()`. Never
hardcode `°C`, `°F`, `km/h` or `mph` in a component. Wind speed is converted too
and is easy to forget.

### Air-quality data is nullable everywhere

`aqi`, `pm2_5`, `pm10`, `o3`, `no2`, `so2`, `co` and `nh3` can all be `null`.
`getEAQIBand(null)` returns a synthetic "No data" band, and NH₃ is omitted from
the panel when absent. New code must guard rather than assume a number.

### Timestamps are Unix seconds

Multiply by 1000 before constructing a `Date`. `src/lib/formatters.ts` already
does this for the current-conditions card — prefer its helpers.

### Location is state in `App`, passed as props

`App` owns the location in priority order: URL query params
(`lat` + `lon`/`lng`, plus `name`) → `localStorage["atmos_last_location"]` →
Tokyo. Every change writes back to both the URL (`history.replaceState`) and
`localStorage`. Map clicks are debounced 150 ms and rounded to 4 decimal places.

Theme and unit are Context (`useTheme()`, `useUnit()`). Location is **not** —
see [ADR 0008](DESIGN_DECISIONS.md#0008-props-for-location-context-for-theme-and-unit).

### `cn` is a real npm package

`src/lib/utils.ts` re-exports `cn` from the `cn` package, which is shadcn-ui's
compiled `clsx` + `tailwind-merge` replacement. It is **not** the hand-rolled
snippet from the shadcn docs. Do not "fix" it into `twMerge(clsx(...))`.

Note that import paths for it are inconsistent by design of the generator:
`ui/button.tsx` and `ui/select.tsx` import from `"cn"` directly, while `Card.tsx`
goes through `lib/utils`. Both work. Plain `clsx` survives in `WeatherIcon.tsx`
only.

### Tailwind v4 has no config file

There is no `tailwind.config`. Design tokens are the `@theme inline` block in
[`src/index.css`](../src/index.css), and dark mode is activated by
`@custom-variant dark (&:is(.dark *))` — which is why `.dark` on `<html>` is
load-bearing. See [ADR 0014](DESIGN_DECISIONS.md#0014-theme-applied-before-first-paint).

The `@/` alias is configured in both `vite.config.ts` and `tsconfig.app.json` but
**is not used** — every import under `src/` is relative. Neither convention is
enforced; match the file you are editing.

## Adding a weather card

1. **Create the component** in `src/components/cards/`, using the shared `Card`
   shell for consistent padding and title treatment.
2. **Read the data** with `useWeather(coords)`. Do not add `fetch` or `useQuery`.
3. **Render inside both boundaries**, mirroring the existing cards in
   `App.tsx`: a `<Suspense fallback={<YourSkeleton />}>` inside a
   `CardErrorBoundary`.
4. **Format through `formatters.ts`** and read the active unit with `useUnit()`.
5. **Add a skeleton** to `src/components/cards/Skeletons.tsx` that matches the
   real card's dimensions, so nothing shifts when data lands.
6. **Place it in the grid** in `App.tsx`. Check the `order-*`, `xl:col-start-*`
   and `xl:row-span-*` utilities — the wide-screen layout is expressed there and
   is easy to break.

### Adding a field from the API

Four places, in this order:

1. The variable name in the relevant `CURRENT` / `HOURLY` / `DAILY` array in
   [`src/api.ts`](../src/api.ts).
2. The mapping inside `getWeather` (or `getAirQuality`).
3. The Zod schema in [`src/schemas/weatherSchema.ts`](../src/schemas/weatherSchema.ts)
   (or `airQualitySchema.ts`). The inferred TypeScript type updates with it.
4. The component that displays it.

`npm run build` will fail at step 3 if you skipped step 1 or 2, which is the
intended safety net.

### Adding a WMO weather code

Two tables, and they **must** be updated in the same commit:

- `WMO` in [`src/api.ts`](../src/api.ts) → `[main, description, iconPrefix]`
- `WMO_ICONS` in [`src/components/WeatherIcon.tsx`](../src/components/WeatherIcon.tsx)
  → `[dayGlyph, nightGlyph]` using `wi-*` classes

Both are keyed by the same 28 codes. A code present in one and not the other
renders as `unknown` / `wi-na`.

## Testing changes manually

There is no automated test suite, so this is your responsibility.

```sh
npm run dev
```

Check at minimum:

- **Every location path** — search a city, click the map, use geolocation, and
  reload a URL containing `?lat=&lon=&name=`.
- **Every unit** — toggle °C/°F and confirm wind speed converts too, not just
  temperature.
- **Every theme** — toggle light/dark, hard-reload to confirm there is no flash,
  and confirm the map basemap swaps.
- **Every breakpoint** — narrow (<768 px, bottom sheet), tablet (768–1279 px),
  and wide (≥1280 px, sticky sidebar).
- **Failure paths** — go offline and confirm the banner appears and the card
  boundaries show their error states with a working Retry.
- **`npm run preview`** — the production build can behave differently from dev.

## Troubleshooting

### `__dirname` build warning

```
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`...
  - `__dirname` (vite.config.ts:10:25). Use `import.meta.dirname` instead
```

Benign today; `configLoader: 'native'` becomes the default in a future Vite
major. Fix with `import.meta.dirname` if you touch the file, or set
`VITE_CONFIG_NATIVE_IGNORE_WARNING=true`.

### The map renders at the wrong zoom, or the user's zoom is lost

`MapContainer`'s `center` prop only sets the **initial** view. Subsequent
movement goes through `MapController`, which calls `map.flyTo()`. If the map
remounts, the Leaflet instance is rebuilt and zoom/pan are discarded — which is
why `Map` is deliberately kept **outside** the weather cards' `<Suspense>`
boundaries. Do not move it inside without solving that.

### A second identical network request appears

Something is calling `useQuery` or `useSuspenseQuery` directly instead of using
`useWeather` / `useAirQuality`, creating a second cache key. Search for
`useQuery(` and `useSuspenseQuery(` in `src/`: both should appear only inside
`src/hooks/`.

### Dark mode flashes white on load

The inline script in `index.html` toggles `.dark` on `<html>` before CSS loads.
If you have moved or removed it, the flash returns. The `ThemeProvider` also
keeps `.dark` on **both** `<html>` and `<body>` — check both.

### Icons do not render (blank squares)

`WeatherIcon.tsx` is the only place the Weather Icons font CSS is imported.
If a new component needs `wi-*` classes, import them through that component
rather than adding a second font import. Verify the glyph exists in
`src/assets/weather-icons/font/` before adding it to `WMO_ICONS`.

### `error` is defined but never used

This repo's ESLint config has **no `argsIgnorePattern`**, so the `_` prefix does
not suppress unused-parameter errors. Delete the parameter, or use it.

### `ZodError` appears in a card's error UI

The response did not match `src/schemas/`. Usually one of three causes: the
variable is missing from the request list in `api.ts`, the mapping was not
updated, or Open-Meteo changed its response. Check the actual network response
in the browser devtools first.

### `react-leaflet` API does not match the docs online

It is pinned to **`5.0.0-rc.2`, a release candidate**, and its API may differ
from the stable v4 documentation you find via search. Read the installed source
in `node_modules/react-leaflet` rather than trusting search results.

## Before you open a pull request

```sh
npm run lint && npm run build
```

Then confirm:

- [ ] Both commands pass.
- [ ] Behaviour is unchanged if you only refactored.
- [ ] No new console statements, TODOs or commented-out code.
- [ ] No API key, secret or `.env` file was added.
- [ ] No new runtime dependency without prior discussion.
- [ ] `CHANGELOG.md` has an entry under `Unreleased`.
- [ ] `docs/` is updated if behaviour, data sources or setup changed.
- [ ] New interactive elements have accessible names and ≥44 px touch targets.

Full details in [`CONTRIBUTING.md`](../CONTRIBUTING.md).