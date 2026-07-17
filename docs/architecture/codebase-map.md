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
       presentational shell: renders header, InputForm, ResultsPanel,
       ExportActions, and dialogs from src/state/useBlindFlangeCalculatorState.ts
```

`BlindFlangeCalculator.tsx` is a thin presentational container. All orchestration state — input state, standard/custom/manual calculation orchestration, configuration JSON schema, and IndexedDB autosave — lives in `src/state/`.

## State Layer

Located under `apps/blind-flange-calculator/src/state/`.

| File | Responsibility |
| --- | --- |
| `useBlindFlangeCalculatorState.ts` | Owns all `useState`/`useEffect`/`useMemo`/`useCallback` orchestration (inputs, derived results, PN forcing, hydrotest auto-pressure, custom DN matching, design-config sync, debounced history autosave, import/export handlers). Exposes a single hook consumed by `BlindFlangeCalculator.tsx`. Also exports `MAX_STANDARD_PN`. `handleImportConfiguration` delegates schema validation/normalization to `migrateConfig`. |
| `configurationFile.ts` | `BlindFlangeConfigurationFile` schema type, `CURRENT_CONFIG_VERSION`, `migrateConfig(value)` (validate + per-version migration ladder → current shape), JSON-import parsing helpers (`isRecord`, `optionalNumber`, `requiredNumber`, `requiredString`, `parseDesignConfig`, `resolveImportedDn`), `createDefaultFlangeTag`, and `MATERIAL_IDS`. See [B-08](bottlenecks-and-risks.md#b-08--configuration-schema-has-no-migration-path). |

## Domain and Standards Modules

Physically isolated under `apps/blind-flange-calculator/src/domain/` — see [B-10](bottlenecks-and-risks.md#b-10--domain-layer-not-physically-isolated). This layer must not import React or any browser/download/CAD/history API; `src/domain/index.ts` re-exports the public API for consumers outside the layer.

| File | Responsibility |
| --- | --- |
| `src/domain/index.ts` | Barrel re-export of the domain layer's public API (types, standards data, calculations) |
| `src/domain/standards/data.ts` | Materials, EN 1092-1 dimension table, gasket options, fastener catalog, standard thicknesses, `STANDARDS_PROVENANCE` (source/edition/notes per data family — see [B-09](bottlenecks-and-risks.md#b-09--weak-provenance-on-standards-tables)). `getFastenerOptions`/`getFastenerOptionsFor` exclude `isPlaceholder` entries (e.g. `EN_25CrMo4`) by default; pass `includePlaceholders: true` to resolve one by id. |
| `src/domain/types/bfTypes.ts` | Shared domain types for inputs/results (framework-free; the UI-only `ResultCardProps` — which needs `ReactNode` — lives in `src/uiTypes.ts` instead) |
| `src/domain/types/manualCheckTypes.ts` | Manual-check result types |
| `src/domain/calculations/allowables.ts` | Allowable stress from yield/γ; hydrotest pressure helpers (EN / ASME style) |
| `src/domain/calculations/gasket.ts` | Standard and custom gasket effective diameter/width heuristics |
| `src/domain/calculations/bolting.ts` | Bolt stress area / hole / pitch tables; Wm1/Wm2 loads; area checks; torque (K-factor) |
| `src/domain/calculations/platePhysics.ts` | Shared circular-plate deflection/stress/thickness helpers (standard/custom/manual) |
| `src/domain/calculations/utils.ts` | Standard-mode `calculateBlindFlange`, PN selection, EN 1092 lookup, thickness/weight orchestration |
| `src/domain/calculations/custom.ts` | Custom auto-sizing search over bolt counts × sizes; failure diagnostics |
| `src/domain/calculations/manualCheck.ts` | Geometry validation and thickness/stress/deflection checks for user-defined dims |
| `src/uiTypes.ts` | UI-only prop types that need React (currently `ResultCardProps`); sibling to `domain/`, not part of it |

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
src/cad/geometry/build-facing-features.ts     RF fuse + RTJ groove cut
src/cad/geometry/deriveFacingParameters.ts    RF/RTJ screening dimension derivation
src/cad/services/cad-worker-protocol.ts       typed worker messages
src/cad/services/cad-worker.ts                WASM load + STEP blob
src/cad/services/cad-worker-client.ts         main-thread Promise API (timeout, AbortSignal cancel, CadWorkerError)
src/cad/hooks/useBlindFlangeCad.ts            React hook (warmup + generate)
```

Geometry source priority: manual check input → design config → custom result → standard result.

STEP solid: disk + optional RF boss or RTJ groove + through bolt holes. Facing dimensions use screening heuristics (not a full B16.5 RTJ table).

## Export and Reporting

| File | Responsibility |
| --- | --- |
| `src/exportUtils.ts` | Thin module: re-exports `exportPdfReport` from `src/export/pdf/`; keeps DXF builders (`buildDxf`, `buildDxfFromManual`) and `downloadTextFile` |
| `src/export/pdf/pdfDoc.ts` | `createPdfDoc()` — dynamic `jspdf` import, shared 15mm margin, page-geometry constants |
| `src/export/pdf/pdfPrimitives.ts` | Shared formatting/drawing helpers: `toFixed`, `fmt`, `drawSectionHeader`, `drawField`, `drawWrapped`, `drawBar`, `drawKeyValueRows` |
| `src/export/pdf/pdfText.ts` | Re-exports `sanitizePdfText` from `src/pdfText.ts` for local use by report builders |
| `src/export/pdf/standardReport.ts` | Standard/custom-sizing calculation report (data tables + technical drawing sheet) → `Blob` |
| `src/export/pdf/manualReport.ts` | Manual-check calculation report (summary + sketch + charts/calculations pages) → `Blob` |
| `src/export/pdf/index.ts` | `exportPdfReport()` dispatcher (manual vs. standard/custom) + filename + `downloadBlob` |
| `src/pdfText.ts` | Unicode → WinAnsi sanitization for jsPDF fonts (canonical implementation) |
| `src/download.ts` | Browser blob download helper |

`exportPdfReport`, `buildDxf`, `buildDxfFromManual`, and `downloadTextFile` are still imported from `src/exportUtils.ts` by `ExportActions.tsx` — the public API is unchanged even though the PDF implementation moved. See [B-03](bottlenecks-and-risks.md#b-03--duplicated-pdf-report-engines).

## Persistence

| File | Responsibility |
| --- | --- |
| `src/history/configurationHistoryStore.ts` | IndexedDB store for live autosave and manual history entries |

Configuration schema:

```text
schema: 'blind-flange-calculator-config'
version: 1  (CURRENT_CONFIG_VERSION in configurationFile.ts)
```

`getAllHistoryEntries` migrates each entry's stored `config` via `migrateConfig` on read (best-effort; a failed migration logs a warning and keeps the raw config instead of throwing).

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
