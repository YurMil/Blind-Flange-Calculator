# Codebase Map

Map of the Blind Flange Calculator repository for developers and documentation maintainers. Paths are relative to the repository root unless noted.

## Repository Top Level

| Path | Role |
| --- | --- |
| `package.json` | Workspace orchestration scripts (`dev:blind-flange`, `build:blind-flange`, `typecheck:blind-flange`) |
| `pnpm-workspace.yaml` | Declares `apps/*` as workspace packages |
| `pnpm-lock.yaml` | Locked dependency versions (required for reproducible CI installs) |
| `.github/workflows/main.yml` | Typecheck, build, artifact validation, cross-repo deploy |
| `apps/blind-flange-calculator/` | Source Vite/React application |
| `static/utility-apps/blind-flange-calculator/` | Generated static publish artifact (`app.html`, `manifest.json`, hashed assets) |
| `docs/` | Product, architecture, development, planning, and agent-skill documentation |

## Application Entry Flow

```text
apps/blind-flange-calculator/index.html
  -> src/main.tsx          StrictMode bootstrap, styles
  -> src/App.tsx           Thin wrapper
  -> src/BlindFlangeCalculator.tsx
       owns calculator state, derives results, wires panels
```

`BlindFlangeCalculator.tsx` is the application container: input state, standard/custom/manual calculation orchestration, configuration JSON schema, and IndexedDB autosave.

## Domain and Standards Modules

| File | Responsibility |
| --- | --- |
| `src/data.ts` | Materials, EN 1092-1 dimension table, gasket options, fastener catalog, standard thicknesses |
| `src/bfTypes.ts` | Shared domain types for inputs/results |
| `src/allowables.ts` | Allowable stress from yield/γ; hydrotest pressure helpers (EN / ASME style) |
| `src/gasket.ts` | Standard and custom gasket effective diameter/width heuristics |
| `src/bolting.ts` | Bolt stress area / hole / pitch tables; Wm1/Wm2 loads; area checks; torque (K-factor) |
| `src/utils.ts` | Standard-mode `calculateBlindFlange`, PN selection, EN 1092 lookup, thickness/weight orchestration |
| `src/custom.ts` | Custom auto-sizing search over bolt counts × sizes; failure diagnostics |
| `src/manualCheck.ts` | Geometry validation and thickness/stress/deflection checks for user-defined dims |
| `src/manualCheckTypes.ts` | Manual-check result types |

Units convention in domain code: **mm**, **bar** (inputs) / **MPa** (formulas), **N**, **N·mm**, **kg**.

## UI Components

Located under `apps/blind-flange-calculator/src/components/`.

| Component | Responsibility |
| --- | --- |
| `InputForm.tsx` | Primary engineering inputs |
| `ResultsPanel.tsx` | Standard/custom results presentation |
| `CustomSizingPanel.tsx` | Custom auto-sizing controls and preference |
| `ManualCheckPanel.tsx` / `ManualCheckCharts.tsx` | Manual geometry check UI and utilization charts |
| `FlangeVisualizer.tsx` | SVG front/side schematic |
| `ExportActions.tsx` | PDF / DXF / STEP export entry surface |
| `StepExportPanel.tsx` | STEP generation status and download |
| `ConfigJsonActions.tsx` | Configuration JSON download/upload |
| `ConfigurationHistoryPanel.tsx` | IndexedDB history browse/restore/delete |
| `CalculationHelpDialog.tsx` | In-app calculation help |
| `CommittedNumberInput.tsx` | Commit-on-blur/enter numeric input |

## CAD / STEP Pipeline

```text
src/cad/types/cad-types.ts
src/cad/geometry/compute-flange-geometry.ts   normalize calculator state -> CAD geometry
src/cad/geometry/validation.ts                pre-WASM geometry checks
src/cad/geometry/build-bolt-hole-pattern.ts
src/cad/geometry/build-blind-flange-solid.ts  disk minus bolt holes (Replicad)
src/cad/geometry/build-facing-features.ts     MVP stub (passthrough)
src/cad/services/cad-worker-protocol.ts       typed worker messages
src/cad/services/cad-worker.ts                WASM load + STEP blob
src/cad/services/cad-worker-client.ts         main-thread Promise API
src/cad/hooks/useBlindFlangeCad.ts            React hook (warmup + generate)
```

Geometry source priority: manual check input → design config → custom result → standard result.

MVP STEP solid is a flat disk with through bolt holes. Raised face / RTJ features are not modeled yet.

## Export and Reporting

| File | Responsibility |
| --- | --- |
| `src/exportUtils.ts` | Standard/custom PDF report, DXF builders, drawing sheet helpers |
| `src/manualPdfReport.ts` | Manual-check PDF report (parallel implementation) |
| `src/pdfText.ts` | Unicode → WinAnsi sanitization for jsPDF fonts |
| `src/download.ts` | Browser blob download helper |

## Persistence

| File | Responsibility |
| --- | --- |
| `src/history/configurationHistoryStore.ts` | IndexedDB store for live autosave and manual history entries |

Configuration schema:

```text
schema: 'blind-flange-calculator-config'
version: 1
```

## Build Scripts

| File | Responsibility |
| --- | --- |
| `vite.config.ts` | Vite build; output to `../../static/utility-apps/blind-flange-calculator`; `base: './'` |
| `scripts/rename-html.mjs` | Rename `index.html` → `app.html` after build |
| `scripts/write-manifest.mjs` | Write `manifest.json` (name, version, buildTime, entry, assets) |

## Dependency Snapshot

Runtime (see `apps/blind-flange-calculator/package.json`):

- React / React DOM — UI
- Tailwind CSS (Vite plugin) — styling
- jsPDF — PDF reports
- Replicad + replicad-opencascadejs — CAD/STEP in a Web Worker
- framer-motion, lucide-react — motion and icons

Declared versions currently use `"latest"`; reproducible installs rely on `pnpm-lock.yaml` and CI `--frozen-lockfile`.

## Related Docs

- [Bottlenecks and Risks](bottlenecks-and-risks.md)
- [Mathematical Model](../development/mathematical-model.md)
- [CI/CD and Deployment](../development/ci-cd-and-deployment.md)
