# AGENTS.md

## Commands
- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build`. This is **also the typecheck**; there is no separate typecheck script.
- `npm run lint` — `eslint .` (flat config, `eslint.config.js`).
- No test setup exists in the repo.

## Stack and conventions
- React 19 + TypeScript + Vite (per README: Tailwind for styling, TanStack Query for data fetching, zod for validation).
- Tailwind v4 via the `@tailwindcss/vite` plugin — there is **no `tailwind.config`**; theme/entry is `@import "tailwindcss"` in `src/index.css`.
- TS is configured with `verbatimModuleSyntax` (use `import type` for type-only imports), `erasableSyntaxOnly` (no enums/namespaces — use const objects or unions), and `noUnusedLocals`/`noUnusedParameters`. Imports carry explicit extensions, e.g. `import App from "./App.tsx"`.

## Data flow
- `src/api.ts` is the single weather adapter. It calls **Open-Meteo** (keyless) and reshapes the response into an OpenWeather One Call–style shape. The shape is defined in `src/schemas/weatherSchema.ts` (zod) and enforced via `weatherSchema.parse(…)`, so any mismatch throws.
- Adding a data field means touching all three places: the Open-Meteo variable list in `api.ts`, the mapping code, and the zod schema.
- Components fetch with `useSuspenseQuery` using a duplicate `queryKey: ["weather"]` and a hardcoded `{ lat: 10, lon: 25 }` (both `HourlyForecast` and `DailyForecast`) — location/geo plumbing is not built yet.
- Timestamps are Unix seconds; `precipitation_probability` is normalized to a `pop` 0..1.

## Gotchas
- **`npm run lint` is currently not green**: it reports 4 errors in `src/components/cards/DailyForecast.tsx` and `HourlyForecast.tsx` (empty `Props = {}` object type + empty destructuring patterns). Don't treat the baseline as passing.
- **Weather icon CSS is not wired up**: `WeatherIcon` emits vendored weather-icons `wi-*` font classes, but `src/assets/weather-icons/css/weather-icons.min.css` is not imported anywhere (`main.tsx` imports only `index.css`), so icons currently render blank. Treat `src/assets/weather-icons/` as a vendored third-party package (bower/docs/sass included) — don't edit it.
- `.env.local` contains an unused `VITE_API_KEY_OPENWEATHER` value; nothing reads it. Data comes from keyless Open-Meteo, not OpenWeather — don't waste effort wiring that key in.
- Repo is a single-commit WIP: no CI, no tests, no other instruction files. README title ("Atom") still differs from the package name (`atmos`).