# Atmos

A weather dashboard. Click anywhere on the map to load the forecast for that
location. Data comes from [Open-Meteo](https://open-meteo.com), which needs no
API key.

## Getting started

```sh
npm install
npm run dev
```

| Script            | Does                                        |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Vite dev server                             |
| `npm run build`   | Typecheck (`tsc -b`), then production build |
| `npm run lint`    | ESLint (flat config)                        |
| `npm run preview` | Serve the production build                  |

## Stack

1. **Styling** — Tailwind CSS v4 via the `@tailwindcss/vite` plugin. There is no
   `tailwind.config`; the entry point is `@import "tailwindcss"` in
   `src/index.css`.
2. **Data fetching** — TanStack Query, via `useSuspenseQuery`.

## Decisions

### The selected location lives in `App` and is passed down as props

```tsx
const [coords, setCoords] = useState<Coords>({ lat: 10, lng: 10 });
```

`App` owns the location. Clicking the map calls `setCoords`, and the new
coordinates are handed to `CurrentWeather`, `HourlyForecast`, `DailyForecast` and
`AdditionalInfo` as props.

The alternative was a provider — Context, Recoil, Zustand — so the cards could
read the location without it being threaded through. We went with props because
the tree is one level deep: `App` owns the state and renders the cards directly,
so there is no intermediate component for it to be drilled through. Passing
`coords` is the same amount of code a provider would need, minus the indirection
and the extra subscription plumbing.

**When to revisit:** this holds as long as `App` renders its consumers directly.
If a component ever needs the location two or three levels down, or two separate
branches need to *set* it, the prop chain stops being free and a provider starts
earning its keep.

### The query key carries the location

Every card reads through one hook, so the key and the fetcher cannot drift apart
between components:

```ts
useSuspenseQuery({
  queryKey: ["weather", coords],
  queryFn: () => getWeather({ lat: coords.lat, lng: coords.lng }),
});
```

Keying on `coords` is what makes clicking a new place refetch. It also means the
four cards share a single cache entry and make a single network request, instead
of four cards each fetching the same thing.

Because `useSuspenseQuery` suspends, its callers have to sit under a `<Suspense>`
boundary — `App` wraps the four cards in one. The map sits deliberately *outside*
that boundary: it doesn't suspend, and remounting `MapContainer` would rebuild
the Leaflet map and throw away the user's zoom and pan on every click.
