# Architecture Documentation

This section describes how the Blind Flange Calculator is structured today, where responsibilities live in source, and which bottlenecks should guide the next refactors.

## Read Order

1. [Codebase Map](codebase-map.md) — what each module does
2. [Application Architecture](../development/application-architecture.md) — intended layers and boundaries
3. [Bottlenecks and Risks](bottlenecks-and-risks.md) — concrete debt and follow-up items
4. [Project Structure](../development/project-structure.md) — repository layout
5. [Future Development Roadmap](../development/future-development-roadmap.md) — prioritized improvements

## Current Shape (Summary)

```text
Browser UI (React)
  -> Domain calculations + embedded standards tables
  -> Results / manual check / history panels
  -> Export (PDF, DXF, JSON) + CAD worker (STEP via Replicad/OpenCascade WASM)
  -> Vite build -> static/utility-apps/blind-flange-calculator/
```

The app is a single-screen Vite/React utility. There is no router and no backend. Persistence is browser-local (IndexedDB configuration history). Deployment publishes a static folder into the host site repository.

## Source of Truth

| Concern | Source of truth |
| --- | --- |
| Formulas and units | `apps/blind-flange-calculator/src/{utils,custom,manualCheck,allowables,bolting,gasket}.ts` + [Mathematical Model](../development/mathematical-model.md) |
| Standards tables | `apps/blind-flange-calculator/src/data.ts` (plus bolt tables in `bolting.ts`) |
| CAD/STEP | `apps/blind-flange-calculator/src/cad/**` + STEP planning doc |
| Build/CI | `apps/blind-flange-calculator/vite.config.ts`, `package.json` scripts, `.github/workflows/main.yml` |
| Architectural debt tracking | [Bottlenecks and Risks](bottlenecks-and-risks.md) |
