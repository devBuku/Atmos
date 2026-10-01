# Design decisions

An architecture-decision log for Atmos. Each entry records **Context**,
**Decision**, **Alternatives considered** and **Consequences**.

Status values: `Accepted` (in force), `Superseded` (replaced by a later entry).

Entries are numbered sequentially and never edited after acceptance — a changed
mind gets a new entry that supersedes the old one.

---

## 0001. Single external data provider: Open-Meteo

**Status:** Accepted

**Context.** A weather dashboard needs a forecast provider, a geocoder, and
ideally air-quality data. The obvious defaults are OpenWeather and WeatherAPI,
both of which require the developer to register for an API key and manage a
secret. A purely client-side app cannot keep a key secret: anything in the
bundle is public.

**Decision.** Use **Open-Meteo** as the sole provider for all three data
domains — forecast (`api.open-meteo.com`), geocoding
(`geocoding-api.open-meteo.com`) and air quality
(`air-quality-api.open-meteo.com`). It requires **no API key and no signup**.

The app is therefore fully static: no backend, no proxy, no secrets, no rate
limit plumbing, no `.env` file. It can be cloned and run with `npm install`
alone.

**Alternatives considered.**

- *OpenWeather / WeatherAPI.* Rejected: mandatory API key. A key shipped in a
  static bundle is a public key, which those providers forbid.
- *A thin serverless proxy.* Rejected: adds a deployment target, a cold-start
  latency, and an operational burden, in exchange for hiding nothing that
  matters.
- *Bundle a community weather dataset.* Rejected: freshness and global coverage
  would be poor.

**Consequences.**

- ✅ No credentials of any kind; forking the project requires no onboarding.
- ✅ Three providers' worth of data behind one vendor and one attribution.
- ⚠️ The app is fully dependent on Open-Meteo's availability and rate limits.
  The retry policy in `src/main.tsx` never retries `4xx` responses, so a rate
  limit surfaces as an error rather than a retry storm.
- ⚠️ Air-quality coverage is European-first (`european_aqi`), not US EPA AQI.
- ⚠️ The data is licensed **CC BY 4.0**, so attribution must remain visible in
  the footer. Removing it is a licensing violation, not a cosmetic choice.

---

## 0002. No API-key-based unit selection: fetch Celsius, convert at render

**Status:** Accepted

**Context.** Open-Meteo can return data pre-converted to Fahrenheit or Celsius
via a `temperature_unit` parameter, and `current` and `hourly` blocks can be
requested in different units. This creates a decision: convert on the wire, or
convert in the browser?

**Decision.** **Always request the wire format** — Celsius for temperature,
`m/s` for wind — by never sending a `temperature_unit` or `wind_speed_unit=kmh`
override (only `wind_speed_unit=ms` is sent, which is the explicit form of the
default). All conversion happens at render time in
[`src/lib/formatters.ts`](../src/lib/formatters.ts), driven by the unit chosen
in `UnitContext`.

Users can switch between Celsius and Fahrenheit; **Celsius is the default**,
falling back to Celsius when `localStorage` has no `atmos_unit` value.

**Alternatives considered.**

- *Fetch in the user's unit.* Tempting because the numbers then need no
  conversion — but it makes the cache key unit-dependent, so toggling the unit
  would invalidate every cached response and refetch everything.
- *Store both units.* Doubles the payload for no benefit.

**Consequences.**

- ✅ The query key is unit-independent: one cache entry serves both units.
- ✅ Switching units is instant and offline-safe — no request is made.
- ✅ Debuggable: what you see in the network tab is what the raw data says.
- ⚠️ Conversion bugs are now possible in the render path. The helpers in
  `formatters.ts` are the single place to look, and wind speed is easy to
  forget — it is converted alongside temperature, not by a generic formatter.
- ⚠️ `forecast` responses must never be cached across a unit change expecting
  the values to differ. They will not; they are always Celsius.

---

## 0003. Zod at the network boundary, and as the type source

**Status:** Accepted

**Context.** The upstream payload is index-based parallel arrays with nullable
fields. Without validation, a missing field surfaces as `NaN` deep inside a
render, and TypeScript types on `fetch` results are a lie — `response.json()`
returns `any`.

**Decision.** Validate every response with **Zod** inside `src/api.ts`, at the
moment of the boundary crossing, before returning it. The schemas in
[`src/schemas/`](../src/schemas) are also the **only** source of the response
types: `export type Weather = z.infer<typeof weatherSchema>`.

A malformed payload **throws**. It does not degrade to a partial result.

**Alternatives considered.**

- *Type assertions (`as Weather`).* No runtime safety at all — the failure
  simply moves later and becomes harder to diagnose.
- *Trust the provider.* Open-Meteo is reliable, but not to the standard of a
  typed contract, and a schema change or a proxy returning an error page would
  be silently rendered as `NaN`.
- *Graceful degradation (fill in defaults).* Rejected: it hides outages and
  makes it impossible to tell the user "this is wrong" versus "this is missing".

**Consequences.**

- ✅ Type and schema can never drift — editing the schema updates the type.
- ✅ Failures are loud and located at the boundary, so the error boundary can
  classify them as a "Data error".
- ✅ Components receive fully-typed, non-`any` data.
- ⚠️ Adding a field requires touching three places: the variable list in
  `api.ts`, the mapping in `getWeather`, and the schema.
- ⚠️ `getWeather` coerces missing numbers in series to `0` rather than `null`,
  which is convenient for components but does hide genuinely absent upstream
  values. Air quality does the opposite and stays nullable throughout.

---

## 0004. Internal responses use an OpenWeather One Call–style shape

**Status:** Accepted

**Context.** Open-Meteo's native response is optimised for the wire, not for
rendering: parallel arrays keyed by index, snake_case field names, Unix
timestamps in seconds, percentages rather than fractions. Consuming it directly
leaks indexing arithmetic into every component.

**Decision.** `getWeather()` reshapes the response into an
**OpenWeather One Call–style object** before validating it: named fields
(`temp`, `feels_like`, `wind_deg`), nested `weather[0].main` / `.description` /
`.icon`, and an array of `hourly` and `daily` records rather than parallel
arrays. Day/night is carried on `weather[0].icon` as an `n`/`d` suffix.

The internal shape is inspired by OpenWeather's documented response format. It
is worth being precise: **OpenWeather was never an actual data provider for
this project** — no OpenWeather endpoint, key, or request appears anywhere in
the code or its history. Only the well-known response *shape* was adopted.

Several Open-Meteo specifics are derived rather than provided:

| Internal field | Derivation |
| --- | --- |
| `hourly` | sliced to 48 entries starting at the current hour |
| `hourly[].pop` | `precipitation_probability / 100` — normalised to 0–1 |
| `daily[].temp.day/night/eve/morn` | hourly sampled at index `day*24 + 12/0/18/6` |
| `daily[].feels_like.*` | `apparent_temperature` at the same offsets |
| `daily[].pressure/humidity/dew_point/clouds` | mean of the day's 24 hourly values |
| `current.dew_point/uvi/visibility` | read from the hourly arrays at the current hour |
| `current.sunrise/sunset` | from `daily[0]` |

**Alternatives considered.**

- *Consume the Open-Meteo shape directly.* Less mapping code, but every
  component would index parallel arrays and know that `hourly` is a
  dense time-indexed array. Changing the API's array layout would ripple
  everywhere.
- *Use the official `openmeteo` SDK.* Rejected — it is installed but unused;
  it wraps the same JSON and adds a dependency without removing the mapping
  work.
- *Return the raw response and let TanStack Query's `select` transform it.*
  Considered; rejected because the transform then runs on every render pass
  rather than once per fetch.

**Consequences.**

- ✅ Components are declarative: `data.hourly.map((h) => …)` with no indexing
  arithmetic.
- ✅ The shape is familiar to anyone who has used a weather API before, which
  lowers the learning curve.
- ✅ The mapping is unit-tested in one place — currently by Zod, since the
  shape *is* the schema.
- ⚠️ An extra transform layer on every response. It is cheap (linear over
  ≤192 hourly entries) and buys much more than it costs.
- ⚠️ The OpenWeather shape implies a "daily feels like" and four daily
  temperature slots that Open-Meteo does not provide; they are approximated
  from hourly samples, so they are estimates, not observations.

---

## 0005. React 19 + TanStack Query for all server state

**Status:** Accepted

**Context.** The app has exactly three remote resources and no mutation. It
needs caching, request deduplication and a retry policy, but it does not need a
client-side data library that also owns auth, normalised stores and optimistic
updates.

**Decision.** Use **TanStack Query v5** for all remote state. Each resource has
one hook in [`src/hooks/`](../src/hooks), and no component calls `useQuery` or
`useSuspenseQuery` directly.

Defaults, set once in [`src/main.tsx`](../src/main.tsx):

| Option | Value |
| --- | --- |
| `staleTime` | 10 minutes |
| `gcTime` | 30 minutes |
| `refetchOnWindowFocus` | `true` |
| `retry` | up to 2 attempts, **never** when the error message contains a `4xx` status |
| `retryDelay` | `1000 × 2^attempt`, capped at 30 s |
| `placeholderData` | `keepPreviousData` |

Geocoding overrides `staleTime` to 1 hour, since place names and their
coordinates are effectively static.

**Alternatives considered.**

- *`fetch` in `useEffect` with manual `useState`.* Rejected: hand-rolled
  in-flight tracking, race conditions on rapid location changes, and four
  cards each duplicating the same loading/error logic.
- *SWR.* A legitimate, smaller alternative. Rejected because the retry policy
  here inspects error messages to suppress `4xx` retries, which is more
  verbose to express in SWR.
- *Redux / Zustand.* Rejected: adds a store for state that is derived entirely
  from two APIs.
- *A per-resource `useQuery` call inside each card.* Rejected — see below.

**Consequences.**

- ✅ Four cards asking for the same coordinates produce **one** HTTP request.
- ✅ `keepPreviousData` means a location change does not flash skeletons: the
  previous location's data stays on screen until the new data arrives.
- ✅ Retries are bounded and never amplify a `4xx`, which would waste quota and
  delay the error UI.
- ⚠️ The retry policy inspects `error.message` for `/\b(4\d\d)\b/`, because the
  error thrown by `api.ts` embeds the status in its message rather than
  carrying a typed status field. That coupling is the weakest seam in the data
  layer; a typed error class would be an improvement.
- ⚠️ There is no cache persistence, so a hard reload refetches everything.
  See the *Alternatives* note on `react-query-persist-client` in
  [0008](#0008-props-for-location-context-for-theme-and-unit).

---

## 0006. Coordinates rounded before the cache key is built

**Status:** Accepted

**Context.** Map clicks arrive at full floating-point precision and can be
millimetres apart. Without normalisation, every click is a distinct cache key
and a distinct request — panning across a city during a drag would issue a
request per click event.

**Decision.** `roundCoords()` in [`src/lib/utils.ts`](../src/lib/utils.ts)
quantises latitude and longitude to **2 decimal places** (~1.1 km at the
equator). The rounded pair is used both as the TanStack Query key and as the
coordinates sent to the API, so the key and the request always agree.

Map clicks are additionally debounced **150 ms** in `App`.

**Alternatives considered.**

- *No rounding.* Rejected: a drag across a map produces a burst of unique keys
  and a burst of requests.
- *Rounding only in the key, not the request.* Rejected: the cache key would
  claim a precision the response does not have, which is a silent lie.
- *Debouncing only.* Rejected: debouncing suppresses the burst but not the
  steady-state problem — two clicks a minute apart in the same city still
  refetch. Together they fix distinct problems.

**Consequences.**

- ✅ Nearby clicks collapse onto one cache entry and one request.
- ✅ The key and the request can never disagree.
- ⚠️ Two locations within ~1.1 km share a response. For a weather dashboard that
  is not a meaningful loss, but it is a deliberate accuracy trade-off.
- ⚠️ `App` writes URL parameters at **4** decimal places (~11 m), which is
  finer than the cache key. That is intentional: a shared URL should be
  precise, while the cache should be coarse.

---

## 0007. Two different loading strategies: suspense for weather, branching for air quality

**Status:** Accepted

**Context.** There are two classes of remote data in this app, and they have
genuinely different importance and different failure costs.

**Decision.** Use **`useSuspenseQuery`** in `useWeather`, consumed by cards
sitting inside `<Suspense>` with a per-card skeleton fallback, and wrapped by
`CardErrorBoundary`. Use **plain `useQuery`** in `useAirQuality`, with
`AirQualityPanel` branching on `isLoading` / `isError` inline.

In `App.tsx` the `<Suspense>` boundaries wrap only the four weather cards.
`Map` sits outside them, behind its own boundary and `MapPlaceholder`.

**Alternatives considered.**

- *Uniform `useQuery` everywhere.* Simplest and most consistent. Rejected: a
  single loading state for four independent cards forces either one spinner for
  everything or a hand-rolled `isLoading` branch in each card, which is exactly
  what suspense removes.
- *Uniform suspense everywhere.* Rejected because air quality is a secondary
  panel. Blocking a whole region on it, and giving it the same visual weight as
  a forecast card, misrepresents its importance.
- *One `<Suspense>` around the whole dashboard.* Rejected: one slow coordinate
  change would blank all four cards instead of just the ones actually refetching.

**Consequences.**

- ✅ Each card shows a skeleton that matches its real layout, so nothing jumps
  when data lands.
- ✅ One card failing does not take down its neighbours; boundaries are
  per-card.
- ✅ The map never remounts. Remounting `MapContainer` would rebuild the Leaflet
  instance and discard the user's zoom and pan — a genuinely annoying bug, not
  a theoretical one.
- ⚠️ Two data-fetching patterns in one codebase. This is a deliberate cost: the
  alternatives were worse. It is documented so it is not "tidied up" by a
  future contributor into a uniform pattern.
- ⚠️ Error classification is string-based (see
  [0009](#0009-class-error-boundary-with-message-sniffing)).

---

## 0008. Props for location, Context for theme and unit

**Status:** Accepted

**Context.** Three pieces of state are shared across the tree: the selected
location, the theme, and the display unit. All three could plausibly use
Context. They are deliberately not treated the same way.

**Decision.**

- **Location flows down as props.** `App` owns it and passes `coords` to each
  card. There is no location Context.
- **Theme and unit are Context** (`ThemeProvider`, `UnitProvider`), consumed via
  `useTheme()` and `useUnit()`.

The split is about *shape*, not importance. Location is read by a small,
well-defined set of direct children of `App` — a prop is the most explicit way
to express that, and it makes the data flow visible when reading a component's
props. Theme and unit are read deep inside leaf components (an icon, a
temperature span, a map tile layer) that have no business receiving a
`coords`-and-preferences prop bag; threading them through props would mean
changing the signature of nearly every leaf.

Both preferences persist to `localStorage` (`atmos_theme`, `atmos_unit`) inside
`try`/`catch` blocks so private-browsing failures are non-fatal.

**Alternatives considered.**

- *All Context.* Rejected: it hides the data flow and makes location state
  reachable from anywhere, including places that have no business changing it.
- *All props.* Rejected: prop drilling for theme and unit through every card.
- *A single "app settings" Context.* Rejected: co-locating two unrelated
  preferences with location would guarantee churn and unclear ownership.

**Consequences.**

- ✅ Reading a card tells you exactly where its data comes from.
- ✅ Theme and unit are reachable from any leaf without ceremony.
- ⚠️ The rule is a judgement call, not a law. A future feature that needs
  location deep inside the tree would legitimately justify a location Context;
  that is a new ADR, not a silent change.
- ⚠️ `useTheme()` and `useUnit()` throw outside their provider. That is
  intentional — a missing provider is a bug, not a runtime condition to handle.

---

## 0009. Class error boundary with message sniffing

**Status:** Accepted

**Context.** Network failures are not all the same, and telling the user
"something went wrong" for a 429 is a poor experience. TanStack Query knows the
retry count but not the HTTP status in a structured form, because `api.ts`
throws a plain `Error` with the status embedded in the message.

**Decision.** `CardErrorBoundary` is a **class component** — the only way to
catch render and suspended-tree errors in React — wrapping each weather card.
`static getDerivedStateFromError` sets state; the render path classifies the
error by substring match:

| Message contains | UI shown |
| --- | --- |
| `429` | "Rate limited" |
| `Failed to fetch`, `NetworkError`, `Load failed` | "Network error" |
| `ZodError`, `parse`, `schema` | "Data error" |
| anything else | "Something went wrong" |

Each state renders a **Retry** button that clears the boundary's error state.

Air quality does not use this boundary; `AirQualityPanel` renders its own
"currently unavailable" message.

**Alternatives considered.**

- *One boundary for the whole dashboard.* Rejected: one failure blanks
  everything, including cards whose data loaded fine.
- *Function components with `react-error-boundary`.* Adds a dependency to avoid
  writing ~40 lines of class component.
- *No error UI at all.* Rejected: an unhandled promise rejection in production
  is a blank card with no explanation.

**Consequences.**

- ✅ A single failing card is isolated and recoverable without a page reload.
- ✅ The user is told something actionable.
- ⚠️ **The classification is coupled to error message text.** If the message
  format in `api.ts` changes, the boundary silently degrades to "Something went
  wrong". This is the clearest candidate for future improvement: a typed
  `HttpError` carrying `status` would remove the coupling in both this boundary
  and the retry policy in [0005](#0005-react-19-tanstack-query-for-all-server-state).
- ⚠️ The boundary does **not** call `componentDidCatch`, so errors are not
  reported anywhere. In a keyless static app there is no reporting endpoint, and
  the error UI already surfaces the problem to the user. A monitoring service
  would be the reason to reintroduce it.

---

## 0010. Map WMO codes directly to icon-font glyphs

**Status:** Accepted

**Context.** Open-Meteo reports a numeric **WMO weather code**. Turning that
into an icon requires a lookup, and the choice of icon vocabulary is a visible
design decision.

**Decision.** Use the **Weather Icons** font by Erik Flowers, vendored at
`src/assets/weather-icons/` and imported in exactly one place,
[`WeatherIcon.tsx`](../src/components/WeatherIcon.tsx). Two lookup tables
translate the WMO code:

- `WMO` in [`api.ts`](../src/api.ts) → `main`, `description`, and an
  OpenWeather-style icon id (`"10d"`), with the day/night suffix taken from the
  `is_day` field.
- `WMO_ICONS` in `WeatherIcon.tsx` → the actual `wi-*` font classes, as a
  `[dayGlyph, nightGlyph]` tuple.

Components determine night-time with `weather[0].icon.endsWith("n")`.

Both tables are keyed by the same 28 codes and **must be updated together**.

**Alternatives considered.**

- *`lucide-react` for weather conditions too.* Rejected: Lucide is excellent for
  UI chrome but has no meteorological vocabulary — there is no "fog", "sleet",
  "thunderstorm with hail" or "snow grains" glyph. The dedicated font is the
  right tool for the pictographic set, and Lucide is still used everywhere else.
- *Raw SVG assets per code.* Rejected: ~28 files to manage, no day/night
  variants, and a heavier bundle than a subsetted webfont.
- *An icon API.* Rejected: adds a network dependency and a failure mode to
  something that can be a static lookup table.

**Consequences.**

- ✅ Weather conditions read correctly and meteorologically, including day/night
  variants.
- ✅ Purely synchronous lookup; no layout shift and no image loading.
- ⚠️ **Two tables to keep in sync.** Adding a WMO code without touching both
  produces a code with a description but no glyph, or vice versa.
- ⚠️ The mapping is deliberately coarse — WMO 51/53/55 share one glyph, and
  85/86 (snow showers) reuse the plain snow glyph. Adding finer distinctions
  means adding glyphs that the font does not have.
- ⚠️ An unmapped code degrades to `["Clouds", "unknown", "04"]` / `wi-na`.
- ⚠️ The vendored directory includes upstream Less/Sass sources, docs and
  builder scripts. It must not be edited or linted as application code.

---

## 0011. Air quality uses European AQI, and null means "no data"

**Status:** Accepted

**Context.** "AQI" is not one standard. The US EPA index, the European
Environment Agency index, and various national scales are numerically
incomparable. Open-Meteo serves `european_aqi`, and its pollutant fields are
frequently absent in regions with no monitoring station.

**Decision.** Display the **European AQI** with WHO µg/m³ thresholds, and label
it as such. Bands and per-pollutant thresholds live in
[`src/constants/airQuality.ts`](../src/constants/airQuality.ts), not inline in
the panel.

**Every air-quality field is nullable**, and the code respects that:
`getEAQIBand(null)` returns a synthetic "No data" band, and NH₃ is omitted from
the panel entirely when `null`.

Note that only the `current` block is requested — there is **no AQI forecast or
history**.

**Alternatives considered.**

- *US EPA AQI.* Rejected: Open-Meteo does not serve it directly, and converting
  EEA → EPA would mean shipping a second band table that could not be validated
  against the source data.
- *Display the raw number with no band.* Rejected: a bare number is
  uninterpretable to most users.
- *Coerce `null` to `0`.* Rejected and explicitly avoided: `0 µg/m³` is a claim
  about the air, not an absence of data. "No data" is the honest rendering.

**Consequences.**

- ✅ The displayed number and its thresholds are internally consistent.
- ✅ Missing data is visibly missing rather than misreported as clean air.
- ⚠️ A user comparing Atmos to a US-based app will see different numbers. The
  "European AQI" label exists to prevent that confusion.
- ⚠️ Every consumer of air-quality data must handle `null`. New code must not
  assume a number.

---

## 0012. Dashboard layout: card grid, one component per breakpoint for air quality

**Status:** Accepted

**Context.** A weather dashboard is conventionally a grid of cards. The
difficulty is that the air-quality panel wants to be in three structurally
different places at three breakpoints: a sticky sidebar on wide screens, a grid
cell on tablets, and a bottom sheet on phones.

**Decision.** `App.tsx` owns a responsive grid. Cards are ordered for mobile
and repositioned for `xl` using explicit `order-*`, `xl:col-start-*` and
`xl:row-span-*` utilities, so the daily forecast spans two rows beside the
current and hourly cards on wide screens.

`AirQualityPanel` is rendered **three times** — once per breakpoint container —
and the map is rendered once inside a `lazy()` boundary.

**Alternatives considered.**

- *Render the panel once and move it with CSS.* Not possible: the three
  placements have genuinely different wrappers (sticky sidebar vs. grid cell vs.
  a sheet with its own header and backdrop).
- *A portal or a single responsive container.* Adds machinery to avoid a
  duplicated render.
- *A single column layout.* Rejected: it discards the dashboard form entirely.

**Consequences.**

- ✅ Each breakpoint gets a purpose-built container, so no component is
  contorted to serve three layouts.
- ✅ Three renders of `AirQualityPanel` cost **one** HTTP request, because they
  share one `useAirQuality` cache entry. This is the clearest justification in
  the codebase for the rule in [0005](#0005-react-19-tanstack-query-for-all-server-state).
- ⚠️ Three mounts means three instances of any state the panel owns. The panel
  holds none, so this is currently free.
- ⚠️ The layout logic is expressed as a dense set of Tailwind utilities in
  `App.tsx`. It is not obvious, and it is the part of the codebase most likely
  to be broken by an unrelated change.

---

## 0013. Static SPA deployment

**Status:** Accepted

**Context.** The app has no server, no database and no build-time secret. It
needs HTTPS in production for browser geolocation to work outside
`localhost`.

**Decision.** Deploy as a **static single-page application**. Vercel is the
primary target and requires no configuration: Vite is auto-detected, the build
command is `npm run build`, and the output directory is `dist`. There is
deliberately **no `vercel.json`** — the framework preset is sufficient, and a
zero-config deploy is one fewer file to keep honest.

Any static host works: publish `dist/` and configure an SPA fallback and HTTPS.

Location state is serialised into **query parameters** (`?lat=&lon=&name=`)
rather than client-side routes. That is what makes a shared link work without a
router, and it is why no routing library is a dependency.

**Alternatives considered.**

- *A Next.js / Remix rewrite.* Rejected: it would add a server or a build step
  that a static dashboard does not need.
- *`react-router` with real routes.* Rejected: query parameters already make
  state shareable, and a router is a large dependency for one page.
- *Hash-based routing.* Rejected: URL fragments are not sent to the server, so
  shared links are less portable.

**Consequences.**

- ✅ Deploy anywhere, including a CDN, with no platform coupling.
- ✅ A link always restores the exact view the sender was looking at.
- ✅ No `vercel.json` to drift out of sync with the build.
- ⚠️ The SPA fallback is only needed if routing is added later; today it is
  mentioned in the README for future-proofing rather than as a current
  requirement.
- ⚠️ `react-leaflet` is pinned to a release candidate under Hippocratic-2.1
  (see [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md)). That licensing
  choice is a genuine open-source concern and is not resolved by this decision.

---

## 0014. Theme applied before first paint

**Status:** Accepted

**Context.** Persisting a theme in `localStorage` and applying it from a React
effect guarantees a **flash of incorrect theme** — the page renders in the
default theme, then repaints. That is the most common complaint about
dark-mode implementations.

**Decision.** Two-part mechanism:

1. An **inline script in `index.html`** reads `localStorage["atmos_theme"]`
   (falling back to `prefers-color-scheme`) and toggles `.dark` on
   `document.documentElement` **before any CSS is parsed**.
2. `ThemeProvider` then keeps `.dark` in sync on **both** `html` and `body`, and
   persists changes to the same key.

Tailwind v4 activates dark mode through
`@custom-variant dark (&:is(.dark *))`, so the class placement is load-bearing.
The map follows the theme in CSS rather than in React: OpenStreetMap publishes a
single tile style, so `.dark .leaflet-tile-pane` in `src/index.css` applies an
`invert()`/`hue-rotate()` filter to the tile layer, and a paired rule restyles the
attribution control. `Map.tsx` therefore does not read `useTheme()` — see
[0015[0015](#0015-osm-standard-tiles-with-a-css-filtered-dark-variant).

**Alternatives considered.**

- *Apply the theme in a `useEffect`.* Rejected: that is precisely what causes
  the flash.
- *Render both themes and toggle visibility.* Rejected: doubles the CSS and
  complicates every colour.
- *Inline CSS `prefers-color-scheme` only.* Rejected: it cannot express an
  explicit user override.

**Consequences.**

- ✅ No flash of incorrect theme on load or reload.
- ✅ The OS preference is respected by default, and an explicit choice wins.
- ⚠️ `.dark` must be kept on **both** `html` and `body`. Setting it on only one
  breaks selectors that assume the other. This is easy to regress.
- ⚠️ A blocking inline script in `index.html` must stay in sync with the storage
  key used by `ThemeProvider`. There is no way to import the constant into
  plain HTML, so the key `atmos_theme` is duplicated across the two.
- ⚠️ Anything added to `index.html` is outside the normal React build path and
  is not type-checked.

---

## Summary

| # | Decision | Status |
| --- | --- | --- |
| [0001](#0001-single-external-data-provider-open-meteo) | Open-Meteo as sole provider, no API key | Accepted |
| [0002](#0002-no-api-key-based-unit-selection-fetch-celsius-convert-at-render) | Fetch Celsius, convert at render, °C default | Accepted |
| [0003](#0003-zod-at-the-network-boundary-and-as-the-type-source) | Zod at the boundary and as the type source | Accepted |
| [0004](#0004-internal-responses-use-an-openweather-one-callstyle-shape) | OpenWeather One Call–style internal shape | Accepted |
| [0005](#0005-react-19-tanstack-query-for-all-server-state) | React 19 + TanStack Query for server state | Accepted |
| [0006](#0006-coordinates-rounded-before-the-cache-key-is-built) | Round coordinates before building the cache key | Accepted |
| [0007](#0007-two-different-loading-strategies-suspense-for-weather-branching-for-air-quality) | Suspense for weather, branching for air quality | Accepted |
| [0008](#0008-props-for-location-context-for-theme-and-unit) | Props for location, Context for theme and unit | Accepted |
| [0009](#0009-class-error-boundary-with-message-sniffing) | Class error boundary with message classification | Accepted |
| [0010](#0010-map-wmo-codes-directly-to-icon-font-glyphs) | Map WMO codes to Weather Icons glyphs | Accepted |
| [0011](#0011-air-quality-uses-european-aqi-and-null-means-no-data) | European AQI; `null` renders as "No data" | Accepted |
| [0012](#0012-dashboard-layout-card-grid-one-component-per-breakpoint-for-air-quality) | Card-grid dashboard, per-breakpoint air-quality containers | Accepted |
| [0013](#0013-static-spa-deployment) | Static SPA, zero-config on Vercel, no router | Accepted |
| [0014](#0014-theme-applied-before-first-paint) | Theme applied pre-paint to avoid FOUC | Accepted |
| [0015](#0015-osm-standard-tiles-with-a-css-filtered-dark-variant) | OSM standard tiles, CSS-filtered dark variant | Accepted |

---

## 0015. OSM standard tiles with a CSS-filtered dark variant

**Status:** Accepted

**Context.** The basemap originally used CARTO's legacy keyless raster basemaps
(`basemaps.cartocdn.com/{light,dark}_all`), which shipped a genuine light and a
genuine dark style. The motivation for moving away was the belief that CARTO
requires an API key.

That premise is only partly right, and it is worth recording precisely: the
`basemaps.cartocdn.com` endpoint Atmos was calling is CARTO's **legacy keyless
basemap** and needs no key. It is CARTO's newer basemap **API** that requires
one. So this switch was not made to escape a key requirement -- none applied. It
was made to remove a third-party basemap vendor and render tiles straight from
the canonical OpenStreetMap source.

**Decision.** Request tiles from the OpenStreetMap standard server at
`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with no API key and no account.

OSM publishes **one** tile style. To keep the map legible in dark mode,
`.dark .leaflet-tile-pane` in `src/index.css` applies:

```css
filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.88) saturate(0.75);
```

`hue-rotate(180deg)` restores the original hue relationships after `invert()`,
which flips every channel. A paired rule restyles the Leaflet attribution
control so its text stays readable against the darkened tiles.

Because theming is now purely CSS, `Map.tsx` no longer imports `useTheme`.

**Alternatives considered.**

- *Keep CARTO.* Would have kept a purpose-designed dark basemap, at the cost of
  depending on a vendor that may re-key or withdraw access.
- *A keyless third-party dark provider.* Rejected: the widely used ones
  (MapTiler, Stadia, Thunderforest) all require signup and an API key, which is
  the exact thing this project is trying to avoid. OSM's own servers are the
  only genuinely keyless option.
- *Vector tiles (MapLibre GL).* Rejected as disproportionate: it needs a style
  JSON, a glyph set, and a vector tile endpoint -- reintroducing the key problem
  this change was meant to solve.
- *Self-hosted tiles.* Rejected: operationally significant for a small
  volunteer-run project.

**Consequences.**

- No tile vendor other than OpenStreetMap, and no basemap API key.
- The map honours dark mode with no React involvement.
- The dark map is a **filtered** raster, not a designed dark style. Roads and
  labels invert correctly, but the palette will not match a purpose-made dark
  basemap. This is a deliberate, documented trade-off.
- **Subject to the [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/):**
  - The canonical `tile.openstreetmap.org` host is required, so Leaflet's
    `subdomains` prop is **not** set -- `{s}` would otherwise be requested
    literally.
  - The `{r}` retina placeholder is **not** used; OSM serves no `@2x` variant,
    so tiles are not retina-sharp on high-DPI displays.
  - No bulk downloading, prefetching, or offline tile downloads. The app has no
    service worker and no tile prefetching, so it complies today.
  - No restrictive `Referrer-Policy`, so the `Referer` header reaches OSM.
    `index.html` sets none, and this must stay that way.
  - Availability is best-effort with **no SLA**; access may be withdrawn without
    notice. If traffic grows, migrate to a hosted provider or self-hosted tiles.
- Attribution must stay visible in the Leaflet attribution control; the policy
  explicitly forbids hiding it behind a toggle or off-screen.

---

## Known open questions

1. **Typed HTTP errors.** Both the retry policy and the error boundary inspect
   `error.message` strings for status codes and error kinds. A typed
   `HttpError` class would remove this coupling from [0005](#0005-react-19-tanstack-query-for-all-server-state)
   and [0009](#0009-class-error-boundary-with-message-sniffing).
2. **`react-leaflet` release candidate.** Pinned to `5.0.0-rc.2` under
   Hippocratic-2.1 rather than a permissive license. A stable 5.x or 4.x should
   be evaluated before the project grows.
3. **Unused dependencies and scaffolding.** `openmeteo`, `src/components/ui/*`
   and several assets are declared or present but unused. Removing them is a
   housekeeping change that should be its own commit.