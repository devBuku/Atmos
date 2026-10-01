## What this pull request changes

<!-- One or two sentences. Link the issue it closes: Closes #123 -->

Closes #

## Why

<!--
The reasoning, not the diff. What problem does this solve for a user of the
app? If you made a trade-off, say so here.
-->

## How it was verified

<!--
Atmos has no automated test suite, so this is the important part. Be specific
about what you tried and what you saw.
-->

- [ ] `npm run lint` passes
- [ ] `npm run build` passes (includes the TypeScript type-check via `tsc -b`)
- [ ] Manually tested on a narrow (mobile) viewport as well as a wide one
- [ ] Checked both the light and dark themes

### Manual testing notes

<!-- What you clicked, what you expected, what happened. -->

## Checklist

- [ ] This pull request targets `main`
- [ ] The change is focused on a single concern
- [ ] I added an entry to `CHANGELOG.md` under `Unreleased`
- [ ] I updated `README.md` / `docs/` if setup, behaviour or data sources changed
- [ ] Data is still read through the existing hooks (`useWeather` / `useAirQuality`) — no direct `useQuery` calls
- [ ] New interactive elements have accessible names and ≥44px touch targets
- [ ] No API keys, secrets or `.env` files were added
- [ ] I have read [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)

## Screenshots

<!-- Before/after for any visual change. Required for UI changes. -->

Before | After
--- | ---
<!-- screenshot A | screenshot B -->

## New dependencies

- [ ] This pull request adds no runtime dependency
- [ ] If it does, I opened an issue first and linked it above
