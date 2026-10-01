# Contributing to Atmos

Thanks for taking the time to contribute! Atmos is a small, dependency-light
project, and pull requests from outside contributors are very welcome.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Quick start

```sh
git clone https://github.com/devbuku/atmos.git
cd atmos
npm install
npm run dev
```

There is no `.env` file to create and no API key to obtain.

## Before you start

- **Open an issue first for anything substantial.** For a new feature, a
  significant refactor, or a dependency change, please describe the idea in an
  issue so we can agree on the approach before you invest time in it. Bug
  reports can go straight to a pull request.
- **Keep the scope tight.** Focused pull requests are much easier to review and
  merge than sweeping ones.

## Workflow

1. **Fork** the repository on GitHub.
2. **Clone your fork** and create a branch off `main`:

   ```sh
   git clone https://github.com/<your-username>/atmos.git
   cd atmos
   git remote add upstream https://github.com/devbuku/atmos.git
   git switch -c my-change
   ```

3. **Make your change**, committing in small logical steps.
4. **Run the checks** (see below). Both must pass before you open a PR.
5. **Push** to your fork and **open a pull request** against `main`.

```sh
git push origin my-change
```

## Commit message style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>
```

Types in use in this repository:

| Type | Use for |
| --- | --- |
| `feat` | A new user-visible feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | Behaviour-preserving code change |
| `perf` | Performance improvement |
| `style` | Formatting only, no logic change |
| `chore` | Dependencies, tooling, build config |

Optional breaking changes use `!` and a `BREAKING CHANGE:` footer:

```
feat(air-quality): add 24h AQI forecast!

Adds an hourly AQI chart to the panel.

BREAKING CHANGE: the air-quality query key format changed.
```

Keep the summary in the imperative mood and under ~72 characters. Existing
history mixes in Conventional Commit prefixes and plain imperative sentences —
either is acceptable, but Conventional Commits are preferred for new work.

## Checks you must run

This project has **no automated test suite**, so lint and build are the whole
verification story. `npm run build` also performs the TypeScript type-check via
`tsc -b`.

```sh
npm run lint
npm run build
```

To preview the production bundle locally before pushing:

```sh
npm run preview
```

A pull request that fails either command will not be merged.

## Code style

- **TypeScript strictness is on.** `tsconfig.app.json` enables
  `verbatimModuleSyntax` (use `import type` for type-only imports),
  `erasableSyntaxOnly` (no `enum`s or `namespace`s — use const objects or union
  types) and `noUnusedLocals` / `noUnusedParameters`.
- **Formatting is not automated.** There is no Prettier config. Match the
  surrounding file: two-space indent, double quotes, semicolons in application
  code. The generated `src/components/ui` files use no semicolons — leave them
  as generated.
- **No new runtime dependencies** without discussing it in an issue first.
- **No code comments explaining *what*.** Comment the *why* when it is not
  obvious, and put design rationale in
  [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) rather than in the
  source.
- **Accessibility is part of the definition of done.** Interactive elements
  need accessible names, and new touch targets should be at least 44 px.

## Adding a weather card or component

1. Create the component under `src/components/` (or `src/components/cards/`
   for a forecast card).
2. Read the data through the existing hooks — `useWeather(coords)` or
   `useAirQuality(coords)`. Do **not** call `useQuery` or `useSuspenseQuery`
   directly: doing so creates a second cache entry and a duplicate HTTP
   request. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
3. Weather cards must render inside both a `<Suspense>` boundary and a
   `CardErrorBoundary`, as `App.tsx` does for the existing four.
4. If you need a new field from the API, update all of:
   - the `CURRENT` / `HOURLY` / `DAILY` variable list in `src/api.ts`,
   - the mapping inside `getWeather`,
   - the Zod schema in `src/schemas/weatherSchema.ts`.

   For a new WMO weather code, also update **both** the `WMO` table in
   `src/api.ts` and the `WMO_ICONS` table in `src/components/WeatherIcon.tsx`.
5. Add a matching skeleton to `src/components/cards/Skeletons.tsx`.
6. Format temperatures and wind through the helpers in `src/lib/formatters.ts`
   and read the active unit with `useUnit()`. Do not hardcode `°C` — the API
   always returns Celsius and conversion is a display concern.

## Opening a pull request

Fill in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
A good pull request:

- targets `main`;
- does one thing;
- has a description explaining *why*, not just *what*;
- confirms that `npm run lint` and `npm run build` pass;
- adds or updates documentation if behaviour or setup changed;
- adds an entry to [`CHANGELOG.md`](CHANGELOG.md) under `Unreleased`.

Maintainers may ask for changes or decline a contribution. That is not a
judgment of you or your work — it is about keeping the codebase coherent.

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include
your browser, OS, the steps to reproduce, and what you expected to happen. A
screenshot or screen recording of a map or chart glitch is extremely helpful.
