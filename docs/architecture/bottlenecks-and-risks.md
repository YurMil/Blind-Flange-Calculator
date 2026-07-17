# Architecture Bottlenecks and Risks

Living inventory of architectural narrow points identified from the current codebase. Use this document when prioritizing refactors, writing ADRs, or planning test coverage.

Status legend:

| Status | Meaning |
| --- | --- |
| **Open** | Confirmed in code; not yet resolved |
| **Mitigated** | Partial guard exists; root cause remains |
| **Resolved** | Fixed; keep entry briefly for history, then archive |

Priority is relative engineering risk, not a delivery commitment.

---

## B-01 — Triplicated plate-physics formulas

| Field | Value |
| --- | --- |
| Priority | High |
| Status | Resolved |
| Area | Domain |
| Resolved in | shared `apps/blind-flange-calculator/src/platePhysics.ts`; covered by unit tests |

**Symptom.** Circular-plate helpers (`calcPlateDeflection`, `calcPlateStress`, `calcThickForStress`, `calcThickForDeflection`) existed in nearly identical form in:

- `apps/blind-flange-calculator/src/utils.ts`
- `apps/blind-flange-calculator/src/custom.ts`
- `apps/blind-flange-calculator/src/manualCheck.ts`

**Resolution.** Helpers now live in `platePhysics.ts` and are imported by all three calculation paths. Unit fixtures live in `src/__tests__/platePhysics.test.ts`.

**Follow-up (optional).** Move `platePhysics.ts` under `src/domain/calculations/` when B-10 lands.
---

## B-02 — Oversized application container state

| Field | Value |
| --- | --- |
| Priority | High |
| Status | Resolved |
| Area | UI / State |
| Resolved in | `src/state/useBlindFlangeCalculatorState.ts` |

**Symptom.** `BlindFlangeCalculator.tsx` owned a large set of `useState` hooks and interdependent `useEffect` chains (PN forcing, hydrotest auto-pressure, custom DN matching, design-config sync, debounced history autosave).

**Resolution.** All orchestration state, derived memos, and event handlers moved into the `useBlindFlangeCalculatorState()` hook in `src/state/useBlindFlangeCalculatorState.ts`. `BlindFlangeCalculator.tsx` now only calls the hook and renders JSX (header, `InputForm`, `ResultsPanel`, `ExportActions`, dialogs), reading everything it needs off the hook's return object. Configuration-file parsing/import helpers and shared types live in `src/state/configurationFile.ts` and are reused by the hook. `MAX_STANDARD_PN` is exported from the state module for the UI.

**Follow-up (optional).** Split the hook further (e.g. a dedicated history-autosave hook) if it grows again.

---

## B-03 — Duplicated PDF report engines

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Resolved |
| Area | Export |
| Resolved in | `apps/blind-flange-calculator/src/export/pdf/` |

**Symptom.** `exportUtils.ts` and `manualPdfReport.ts` each implemented report layout helpers and formatting conventions. Drawing primitives for the technical sheet lived only in the standard report path.

**Resolution.** Shared layout/formatting/drawing primitives now live in `src/export/pdf/pdfPrimitives.ts` (`toFixed`, `fmt`, `drawSectionHeader`, `drawField`, `drawWrapped`, `drawBar`, `drawKeyValueRows`), with document setup centralized in `src/export/pdf/pdfDoc.ts` (`createPdfDoc()`, dynamic `jspdf` import, shared 15mm margin). The standard/custom report builder (`standardReport.ts`) and manual-check report builder (`manualReport.ts`) each assemble content with these primitives and return a `Blob`; `index.ts` dispatches between them and owns the filename/download step. `exportUtils.ts` re-exports `exportPdfReport` from `./export/pdf` and keeps only the DXF builders and `downloadTextFile`. `manualPdfReport.ts` was deleted.

**Intentional behavior note.** The manual report's page margin changed from 14mm to 15mm to match the standard report (both now use `PDF_MARGIN_MM = 15` from `pdfDoc.ts`), shifting manual-report layout by ~1mm.

**Follow-up (optional).** Move DXF builders (`buildDxf`, `buildDxfFromManual`) out of `exportUtils.ts` into a sibling `src/export/dxf/` module for full parity with the PDF split.

---

## B-04 — No automated test suite

| Field | Value |
| --- | --- |
| Priority | High |
| Status | Mitigated |
| Area | Quality |
| Resolved in | Vitest unit suite + CI `pnpm test:blind-flange` gate |

**Symptom.** CI previously ran TypeScript check + production build + artifact shape validation only.

**Resolution.**

- Vitest configured via `apps/blind-flange-calculator/vitest.config.ts`
- Domain unit tests: plate physics, allowables, PN/bolting/standard calc, CAD validation
- Root script `pnpm test:blind-flange` / `pnpm test`
- CI quality job runs unit tests before build

**Still open (deferred).**

- Component tests (`@testing-library/react`)
- Playwright browser smoke (load → calculate → export)

See [Testing and Quality](../development/testing-and-quality.md).
---

## B-05 — CAD worker lacks timeout / cancel hardening

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Resolved |
| Area | CAD |
| Resolved in | `cad-worker-client.ts` timeouts + AbortSignal cancel; Cancel button in `StepExportPanel` |

**Symptom.** CAD worker client tracked pending requests but had no request timeout or cancellation protocol.

**Resolution.**

- `CadWorkerError` with codes `timeout` | `cancelled` | `worker`
- Default timeouts: warmup 90s, STEP generation 120s
- `AbortSignal` support; abort terminates and recreates the worker
- UI Cancel control while generating STEP

**Still open.** Facing features remain MVP stubs — see **B-06**.

---

## B-06 — Facing features not modeled in STEP

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Open (intentional MVP stub) |
| Area | CAD |

**Symptom.** `build-facing-features.ts` is a passthrough. Exported solids are flat disks with bolt holes regardless of RF/FF/IBC selection.

**Why it matters.** Users may assume STEP geometry reflects facing. Downstream manufacturing use of the file can be wrong if facing is required.

**Follow-up.**

1. Implement raised-face and RTJ groove solids per the STEP plan.
2. Keep UI warnings until features are complete.
3. Add geometry validation fixtures for facing envelopes.

---

## B-07 — Dependencies declared as `"latest"`

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Resolved |
| Area | Tooling |
| Resolved in | pinned versions in `package.json` + Dependabot |

**Symptom.** Dependencies were declared as `"latest"`.

**Resolution.**

- Exact versions pinned in `apps/blind-flange-calculator/package.json`
- `.github/dependabot.yml` for weekly npm and monthly Actions updates
- CI continues to use `--frozen-lockfile`

**Follow-up.** Keep Dependabot PRs reviewed; document any deliberate major upgrades in the changelog when one exists.
---

## B-08 — Configuration schema has no migration path

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Open |
| Area | Persistence / Export |

**Symptom.** Config files and IndexedDB entries use `schema: 'blind-flange-calculator-config', version: 1` with defensive import defaults, but no explicit migration functions for future breaking changes.

**Follow-up.**

1. Add `migrateConfig(file) -> currentVersion` with per-version transformers.
2. Version IndexedDB records and migrate on read.
3. Keep import validation allow-lists.

---

## B-09 — Weak provenance on standards tables

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Open |
| Area | Standards data |

**Symptom.** Most of `data.ts` (materials, EN 1092 table, gasket m/y) lacks source citations. Fastener entries are partially annotated; `EN_25CrMo4` remains an explicit placeholder (`isPlaceholder`) still selectable in the catalog.

**Why it matters.** Engineering auditability and trust. Placeholder grades can confuse users even when checks are blocked.

**Follow-up.**

1. Add `source` / `edition` / `notes` metadata to every table family.
2. Remove or clearly quarantine placeholder fasteners from the default UI catalog.
3. Document lookup rules in [Mathematical Model](../development/mathematical-model.md).

---

## B-10 — Domain layer not physically isolated

| Field | Value |
| --- | --- |
| Priority | Low–Medium |
| Status | Open |
| Area | Structure |

**Symptom.** Domain modules do not import React (good), but they remain flat under `src/` mixed with export/CAD/history rather than a dedicated `src/domain/` package/folder. Bolt geometry tables live in `bolting.ts` while other standards live in `data.ts`.

**Follow-up.**

1. Move pure calculation + standards into `src/domain/` as in the migration plan.
2. Keep CAD, export, and history at sibling boundaries.
3. Align docs after the move.

---

## B-11 — No lint / bundle budget / audit in CI

| Field | Value |
| --- | --- |
| Priority | Low |
| Status | Open |
| Area | Quality / Ops |

**Symptom.** No ESLint config, no dependency audit step, no WASM/bundle size budget check for Replicad/OpenCascade assets.

**Follow-up.**

1. Add lint job.
2. Track `static/.../assets` size for WASM regressions.
3. Optional `pnpm audit` with documented exceptions.

---

## Suggested Work Order

When capacity is limited, tackle remaining bottlenecks in this order:

1. ~~**B-04** tests for existing formulas~~ (Mitigated — unit + CI done; component/Playwright deferred)
2. ~~**B-01** shared plate physics~~ (Resolved)
3. ~~**B-02** state boundary~~ (Resolved)
4. ~~**B-03** shared PDF export module~~ (Resolved)
5. ~~**B-05** CAD timeout/cancel~~ (Resolved) / **B-06** facing features
6. ~~**B-07**~~ (Resolved) / **B-08 / B-09** schema + standards provenance
7. **B-10 / B-11** structure and CI hygiene

Update this file when an item is mitigated or resolved. Cross-link resolved items from [Future Development Roadmap](../development/future-development-roadmap.md).