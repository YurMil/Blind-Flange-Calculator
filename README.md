# Blind Flange Calculator

Browser-based engineering utility for **blind flange sizing, bolting and thickness screening, reporting, and MVP CAD/STEP export**.

It helps mechanical and piping teams turn design inputs (DN, pressure, temperature, material, gasket, fasteners) into a first-pass geometry, check notes, shareable reports, and a simple STEP blank — without starting a full desktop CAD or code-calculation session for every screening question.

> This tool is a **sizing and screening aid**. Final pressure-equipment design must be verified against the project specification, applicable code edition, certified material and gasket data, and responsible engineer review.

---

## What Problems It Solves

| Problem | How the app helps |
| --- | --- |
| “Which EN 1092-1 class and bolt pattern fit this DN / pressure?” | Standard-mode lookup from an embedded EN 1092-1 dimension table |
| “Is plate thickness and bolting adequate for a first pass?” | Thickness, stress, deflection, gasket-load, and bolt-area checks |
| “Required PN is outside the table — what custom geometry is plausible?” | Custom auto-sizing over bolt counts × sizes (min weight or min bolts) |
| “Does this proposed manual geometry clear spacing and edge rules?” | Manual-check path with pass/fail summaries and charts |
| “How do we share inputs and results with the team?” | PDF report, DXF sketch, versioned JSON configuration, local history |
| “Can we drop a blank into CAD quickly?” | STEP export (flat disk + bolt holes) via a Web Worker |

**Primary users:** pressure-vessel / piping engineers, designers needing quick geometry, and CAD/automation engineers who need an MVP solid for further detailing.

For a fuller product description, see [Product Overview](docs/product/overview.md).

---

## Core Algorithms (with Examples)

All calculations run **in the browser**. Domain logic lives under `apps/blind-flange-calculator/src/`. Detailed formulas and assumptions are in the [Mathematical Model](docs/development/mathematical-model.md); numeric walkthroughs are in [Worked Examples](docs/algorithms/worked-examples.md).

### 1. Standard sizing pipeline

```text
inputs (DN, P, T, material, gasket, fasteners)
  -> select target PN from operating pressure
  -> pick EN 1092-1 dims for DN (lowest PN ≥ target)
  -> gasket effective geometry
  -> bolt loads Wm1 / Wm2 (seating, operating, hydrotest)
  -> bolt area + torque checks
  -> thickness / stress / deflection / weight
  -> result object for UI + exports
```

**PN selection example** (`getCalculatedPN`):

| Operating pressure (bar) | Target PN |
| ---: | ---: |
| ≤ 10 | 10 |
| ≤ 16 | 16 |
| ≤ 40 | 40 |
| ≤ 63 | 63 |
| … | … |
| > 320 | 400 |

### 2. Gasket bolt loads (Taylor-Forge style)

```text
P_MPa = P_bar × 0.1

Wm1       = π · G · b · y
Wm2_op    = (π · G² · P_op)/4   + 2 · π · b · G · m · P_op
Wm2_hydro = (π · G² · P_test)/4 + 2 · π · b · G · m · P_test
```

Bolt area must cover the governing case among seating, operating, and hydrotest (`calcBoltAreaChecks` in `bolting.ts`).

### 3. Allowable stress

```text
S = Re_T / γ
```

Yield `Re_T` uses the **nearest lower temperature bucket** in the material table (no linear interpolation). Operating γ = 1.5; test γ = 1.05 (EN) or 1.1 (ASME path).

### 4. Custom auto-sizing

Brute-force search over candidate bolt counts and metric sizes: derive bolt circle and OD from clearance rules, evaluate full checks, keep passing candidates, sort by **minimum weight** or **minimum bolt count**.

### 5. Manual check

Validates user-defined OD, bolt circle, bolt count/size, gasket envelope, and thickness against geometry clearances and the same family of thickness / stress / deflection checks.

### Minimal API sketch

```ts
import { calculateBlindFlange } from './utils';
import { calculateCustomBlindFlange } from './custom';
import { runManualCheck } from './manualCheck';

const standard = calculateBlindFlange({ /* CalculationInput, geometryMode: 'standard' */ });
const custom = calculateCustomBlindFlange(/* custom inputs + preference */);
const manual = runManualCheck(/* ManualCheckInput */);
```

---

## Technology and Architecture (Summary)

| Layer | Solution | Where to read more |
| --- | --- | --- |
| UI | React 19 + Vite + Tailwind | [Codebase Map](docs/architecture/codebase-map.md) |
| Domain | Pure TypeScript modules (no React imports) | [Mathematical Model](docs/development/mathematical-model.md) |
| Standards data | Embedded tables in `data.ts` / `bolting.ts` | [Codebase Map](docs/architecture/codebase-map.md) |
| CAD / STEP | Replicad + OpenCascade WASM in a Web Worker | [Architecture](docs/architecture/README.md), STEP planning doc under `docs/` |
| Reports | jsPDF (PDF), hand-built DXF, JSON config | [Application Architecture](docs/development/application-architecture.md) |
| Persistence | IndexedDB configuration history | [Codebase Map](docs/architecture/codebase-map.md) |
| Delivery | pnpm workspace → static `app.html` + `manifest.json` | [CI/CD and Deployment](docs/development/ci-cd-and-deployment.md) |

High-level flow:

```text
User input
  -> React UI
  -> domain calculations + standards tables
  -> results / manual check / history
  -> PDF · DXF · JSON · STEP
  -> Vite build -> static/utility-apps/blind-flange-calculator/
```

### Known architectural bottlenecks

The codebase is production-usable as a screening tool, but several structural risks are tracked explicitly for further work:

- Triplicated plate-physics helpers across standard / custom / manual paths
- Large stateful container component (`BlindFlangeCalculator.tsx`)
- Duplicated PDF report engines
- No unit/e2e test suite yet (CI = typecheck + build)
- CAD worker needs timeout/cancel; facing features are MVP stubs
- Dependencies declared as `"latest"` (lockfile is the real pin)

Full inventory with priorities and follow-ups: **[Bottlenecks and Risks](docs/architecture/bottlenecks-and-risks.md)**.

---

## Documentation Map

Everything lives under [`docs/`](docs/README.md):

| Area | Start here |
| --- | --- |
| Product intent | [Product Overview](docs/product/overview.md) |
| Algorithms & examples | [Worked Examples](docs/algorithms/worked-examples.md) · [Mathematical Model](docs/development/mathematical-model.md) |
| Architecture | [Architecture Index](docs/architecture/README.md) · [Codebase Map](docs/architecture/codebase-map.md) · [Bottlenecks](docs/architecture/bottlenecks-and-risks.md) |
| Day-to-day development | [Development Index](docs/development/README.md) |
| CI / deploy | [CI/CD and Deployment](docs/development/ci-cd-and-deployment.md) |
| Roadmap | [Future Development Roadmap](docs/development/future-development-roadmap.md) |
| Agent skills | [Skill Pack](docs/skills/README.md) |

---

## Quick Start

Requirements: **Node.js ≥ 22**, **pnpm 10.33.0** (via Corepack).

```bash
corepack enable
corepack pnpm install
corepack pnpm dev:blind-flange
```

Build and typecheck:

```bash
corepack pnpm typecheck:blind-flange
corepack pnpm build:blind-flange
```

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev:blind-flange` | Local Vite dev server |
| `corepack pnpm typecheck:blind-flange` | TypeScript `--noEmit` |
| `corepack pnpm build:blind-flange` | Production static artifact |
| `corepack pnpm build` / `typecheck` | Root aliases to the app scripts |

Build output:

```text
static/utility-apps/blind-flange-calculator/
  app.html
  manifest.json
  assets/
```

---

## Repository Layout

```text
apps/blind-flange-calculator/     Source Vite application
static/utility-apps/.../         Published static artifact (generated)
docs/                            Product, architecture, math, ops docs
.github/workflows/main.yml       CI/CD
```

## Engineering Principle

Keep **calculations**, **standards data**, **CAD generation**, **UI**, **exports**, and **deployment automation** separated. That keeps the tool maintainable, testable, and ready for a future split into a dedicated application repository.

When changing architecture or formulas, update the matching document under `docs/` in the same change — especially [Bottlenecks and Risks](docs/architecture/bottlenecks-and-risks.md) and the [Mathematical Model](docs/development/mathematical-model.md).
