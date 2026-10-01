# Third-party notices

Atmos is MIT licensed (see [LICENSE](LICENSE)). This file records the licenses
of everything Atmos bundles, vendors or depends on, as required by those
licenses. It was compiled from the manifests in `package.json`,
`package-lock.json`, the vendored asset in `src/assets/weather-icons/` and the
license headers shipped inside those assets.

This project is distributed as-is. Nothing here grants additional rights to the
copyright of the listed works beyond what their own licenses grant.

---

## 1. Data and map providers

These are **runtime services**, not redistributed code. Their terms are
satisfied by the attribution rendered in the application.

### Open-Meteo

- **Used for:** all weather forecast, geocoding and air-quality data.
- **Website:** <https://open-meteo.com>
- **License:** the *data* is licensed **CC BY 4.0**. The API is free and requires
  no key.
- **Attribution requirement:** credit Open-Meteo with a link. Satisfied by the
  application footer ("Weather data by Open-Meteo.com (CC BY 4.0)") and by
  `index.html` metadata.
- **Endpoints consumed:** `api.open-meteo.com/v1/forecast`,
  `geocoding-api.open-meteo.com/v1/search`,
  `air-quality-api.open-meteo.com/v1/air-quality`.

### OpenStreetMap contributors

- **Used for:** the underlying map data rendered by the basemap tiles.
- **Website:** <https://www.openstreetmap.org/copyright>
- **License:** map data is © OpenStreetMap contributors, available under the
  **Open Database License (ODbL)**.
- **Attribution requirement:** "© OpenStreetMap contributors". Satisfied in the
  Leaflet tile attribution control, in the application footer, and in
  `public/manifest.json` attribution fields.

> Atmos does **not** request tiles from OpenStreetMap's own tile servers — it
> uses CARTO's basemap tiles (below), which render OSM data. Only CARTO's tile
> usage terms are therefore directly engaged.

### CARTO

- **Used for:** the light and dark basemap raster tiles
  (`basemaps.cartocdn.com`).
- **Website:** <https://carto.com/basemaps>
- **License / terms:** subject to CARTO's
  [Basemap Terms of Use](https://carto.com/basemap/terms-of-use/). Basemap
  cartography is © CARTO; the underlying data is © OpenStreetMap contributors.
- **Attribution requirement:** attribution to CARTO. Satisfied in the Leaflet
  tile attribution control.

---

## 2. Icons and fonts

### Weather Icons

- **Author:** Erik Flowers (<erik@helloerik.com>)
- **Homepage:** <https://erikflowers.github.io/weather-icons/>
- **Source:** <https://github.com/erikflowers/weather-icons>
- **Vendored at:** `src/assets/weather-icons/`
- **Version vendored:** 2.0.12 (per the vendored `package.json`; the bundled
  CSS header states 2.0.10).
- **License**, per the header of the vendored `css/weather-icons.css`:
  - **icon font (`font/`)** — SIL Open Font License 1.1
  - **CSS / SCSS / LESS** — MIT License
  - **documentation** — CC BY 3.0
  - *Inspired by and designed as a companion to Font Awesome by Dave Gandy.*
- **Modifications:** the upstream distribution is included unmodified, including
  its Less/Sass sources, documentation and build tooling.

### Geist

- **Author:** The Geist Project Authors, © 2024 Vercel
- **Source:** <https://github.com/vercel/geist-font>
- **Distributed via:** `@fontsource-variable/geist`
- **License:** SIL Open Font License 1.1 (see the package's bundled `LICENSE`).
- **Usage:** self-hosted as the application UI font; no external font CDN is
  contacted at runtime.

### Lucide

- **Author:** Eric Fennis and contributors
- **Website:** <https://lucide.dev>
- **Distributed via:** `lucide-react`
- **License:** ISC.

---

## 3. Application libraries

Versions are as declared in `package.json`.

### Runtime dependencies

| Package | Version | License | Purpose |
| --- | --- | --- | --- |
| `react` | ^19.2.8 | MIT | UI runtime |
| `react-dom` | ^19.2.8 | MIT | DOM renderer |
| `@tanstack/react-query` | ^5.104.0 | MIT | Server-state caching |
| `zod` | ^4.6.5 | MIT | Runtime schema validation |
| `tailwindcss` | ^4.3.3 | MIT | CSS framework |
| `@tailwindcss/vite` | ^4.3.3 | MIT | Tailwind's Vite integration |
| `leaflet` | ^1.9.4 | BSD-2-Clause | Map library |
| `react-leaflet` | ^5.0.0-rc.2 | **Hippocratic-2.1** ⚠️ | React bindings for Leaflet |
| `lucide-react` | ^1.48.0 | ISC | Icons |
| `cn` | ^0.4.0 | MIT | `clsx` + `tailwind-merge` replacement |
| `clsx` | ^2.1.1 | MIT | Conditional class names |
| `class-variance-authority` | ^0.7.1 | Apache-2.0 | Component variant API |
| `@base-ui/react` | ^1.8.0 | MIT | Unstyled UI primitives |
| `shadcn` | ^4.21.0 | MIT | `shadcn/ui` CLI |
| `tw-animate-css` | ^1.4.0 | MIT | Tailwind animation utilities |
| `@fontsource-variable/geist` | ^5.3.0 | OFL-1.1 | Self-hosted variable font |
| `openmeteo` | ^1.2.3 | MIT | Open-Meteo SDK — **declared but never imported** |

### Development dependencies

| Package | Version | License |
| --- | --- | --- |
| `vite` | ^8.3.0 | MIT |
| `@vitejs/plugin-react` | ^6.1.1 | MIT |
| `typescript` | ~6.0.2 | Apache-2.0 |
| `eslint` | ^10.10.0 | MIT |
| `@eslint/js` | ^10.0.1 | MIT |
| `typescript-eslint` | ^8.69.0 | MIT |
| `eslint-plugin-react-hooks` | ^7.1.1 | MIT |
| `eslint-plugin-react-refresh` | ^0.5.6 | MIT |
| `globals` | ^17.12.0 | MIT |
| `@types/leaflet` | ^1.9.22 | MIT |
| `@types/node` | ^24.19.0 | MIT |
| `@types/react` | ^19.2.18 | MIT |
| `@types/react-dom` | ^19.2.7 | MIT |

### ⚠️ Notice regarding `react-leaflet`

`react-leaflet` is pinned to `5.0.0-rc.2`, a **release candidate** licensed
under the **Hippocratic-2.1** license rather than a conventional permissive
license. Hippocratic-2.1 adds use-based restrictions on top of Apache-2.0.
Review <https://github.com/react-leaflet/react-leaflet/blob/master/LICENSE>
before redistributing a build that bundles it, or move to the stable 5.x/4.x
release.

---

## 4. Design inspiration

### AustinDavisTech/WeatherApp

- **Repository:** <https://github.com/AustinDavisTech/WeatherApp>
- **Relationship:** the dashboard layout and card-based presentation were
  informed by this project as **design and UX inspiration only**.
- **Code copied:** **none.** A review of the repository's full commit history
  and a text search across the working tree found no source code, markup or
  assets derived from this project.
- **License obligation:** none is triggered, because no code or assets were
  copied. The original project's own license should be reviewed if that changes.

---

## 5. Generated files

The following are produced by the tooling itself and carry their own upstream
terms, which apply to the generated output:

- `src/components/ui/button.tsx`, `src/components/ui/select.tsx` — generated in
  the style of `shadcn/ui` (MIT).
- `src/index.css` design tokens and `@import` layer — part of this repository
  (MIT).

---

## 6. Documentation

This project's `CODE_OF_CONDUCT.md` is adapted from the
[Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/),
which is released under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
