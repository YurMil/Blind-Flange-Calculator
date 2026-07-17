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
| Status | Open |
| Area | Domain |

**Symptom.** Circular-plate helpers (`calcPlateDeflection`, `calcPlateStress`, `calcThickForStress`, `calcThickForDeflection`) exist in nearly identical form in:

- `apps/blind-flange-calculator/src/utils.ts`
- `apps/blind-flange-calculator/src/custom.ts`
- `apps/blind-flange-calculator/src/manualCheck.ts`

**Why it matters.** A model change (Poisson ratio, deflection limit, plate theory) can update one path and silently leave standard / custom / manual modes inconsistent.

**Follow-up.**

1. Extract a single `domain/calculations/platePhysics.ts` module.
2. Add unit fixtures covering deflection and thickness for shared helpers.
3. Delete local copies after call-site migration.

**Related.** [Mathematical Model](../development/mathematical-model.md), roadmap item “Domain Layer Consolidation”.

---

## B-02 — Oversized application container state

| Field | Value |
| --- | --- |
| Priority | High |
| Status | Open |
| Area | UI / State |

**Symptom.** `BlindFlangeCalculator.tsx` owns a large set of `useState` hooks and interdependent `useEffect` chains (PN forcing, hydrotest auto-pressure, custom DN matching, design-config sync, debounced history autosave).

**Why it matters.** Hard to reason about, easy to introduce subtle state bugs when adding panels or export modes, difficult to unit-test without mounting the whole tree.

**Follow-up.**

1. Introduce a focused state boundary (`src/state/`) for inputs, derived results, UI flags, and history.
2. Keep derived engineering values as pure domain calls / selectors.
3. Leave presentational components free of orchestration effects.

---

## B-03 — Duplicated PDF report engines

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Open |
| Area | Export |

**Symptom.** `exportUtils.ts` and `manualPdfReport.ts` each implement report layout helpers and formatting conventions. Drawing primitives for the technical sheet live only in the standard report path.

**Why it matters.** Visual/format drift between standard and manual PDFs; duplicated bug fixes; larger review surface.

**Follow-up.**

1. Create `src/export/pdf/` with shared layout, formatting, and drawing helpers.
2. Keep report *content assembly* separate from *jsPDF rendering*.
3. Reuse calculated result objects; never recalculate inside export code.

---

## B-04 — No automated test suite

| Field | Value |
| --- | --- |
| Priority | High |
| Status | Open |
| Area | Quality |

**Symptom.** CI runs TypeScript check + production build + artifact shape validation only. No Vitest/Jest/Playwright config or `*.test.ts` files are present despite documentation recommending them.

**Why it matters.** Formula regressions and geometry edge cases can ship undetected. Refactors of B-01/B-02 become risky without fixtures.

**Follow-up.**

1. Add Vitest for domain modules (`utils`, `custom`, `manualCheck`, `bolting`, `allowables`, CAD validation).
2. Add component tests for critical form/result interactions.
3. Add Playwright smoke for load → calculate → export happy path.
4. Gate CI on unit tests before deploy.

**Related.** [Testing and Quality](../development/testing-and-quality.md).

---

## B-05 — CAD worker lacks timeout / cancel hardening

| Field | Value |
| --- | --- |
| Priority | Medium |
| Status | Mitigated (progress events exist; no timeout/cancel) |
| Area | CAD |

**Symptom.** `cad-worker-client.ts` tracks pending requests but has no request timeout or cancellation protocol. A hung WASM init or STEP export can leave the UI in a perpetual generating state. Worker `error` rejects all pending requests.

**Follow-up.**

1. Add timeout + typed error responses.
2. Add cancel message and abort pending UI state.
3. Keep geometry validation before WASM work (already present — preserve).
4. Document facing-feature MVP limits in UI (partially present in `StepExportPanel`).

**Related.** [Plane 3D STEP Generation Spec](<../Plane%203D%20STEP%20Generation%20for%20BlindFlangeCalculator.md>).

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
| Status | Mitigated (lockfile + CI frozen install) |
| Area | Tooling |

**Symptom.** `apps/blind-flange-calculator/package.json` pins dependencies to `"latest"`. Reproducibility depends on committed `pnpm-lock.yaml` and disciplined `--frozen-lockfile` usage.

**Follow-up.**

1. Pin explicit semver ranges (or exact versions) in `package.json`.
2. Add Dependabot/Renovate.
3. Document upgrade policy in development workflow.

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

When capacity is limited, tackle bottlenecks in this order:

1. **B-04** tests for existing formulas (enables safe change)
2. **B-01** shared plate physics (removes silent drift)
3. **B-02** state boundary (reduces UI coupling)
4. **B-03** shared PDF export module
5. **B-05 / B-06** CAD hardening and facing features
6. **B-07 / B-08 / B-09** packaging, schema, standards provenance
7. **B-10 / B-11** structure and CI hygiene

Update this file when an item is mitigated or resolved. Cross-link resolved items from [Future Development Roadmap](../development/future-development-roadmap.md).
