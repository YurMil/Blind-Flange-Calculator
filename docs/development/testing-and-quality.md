# Testing and Quality Strategy

The quality gate is TypeScript, unit tests, and production build validation. Component and browser tests remain planned follow-ups.

## Current Quality Gates

Local checks:

```bash
corepack pnpm typecheck:blind-flange
corepack pnpm test:blind-flange
corepack pnpm build:blind-flange
```

CI checks (`.github/workflows/main.yml`):

- Install dependencies with `pnpm install --frozen-lockfile`.
- Typecheck the utility app.
- Run unit tests (`pnpm test:blind-flange`).
- Build the utility app.
- Validate `app.html`, `manifest.json`, and `assets/`.
- Upload the static app artifact.

## Unit Tests (implemented)

Tooling:

```text
vitest
apps/blind-flange-calculator/vitest.config.ts
```

Current coverage (`src/__tests__/`):

| Suite | Focus |
| --- | --- |
| `platePhysics.test.ts` | Shared plate deflection/stress/thickness helpers |
| `allowables.test.ts` | Yield temperature selection, γ factors, hydrotest |
| `calculations.test.ts` | PN mapping, bolt loads/area, standard `calculateBlindFlange` |
| `cadValidation.test.ts` | STEP geometry pre-checks |

Run:

```bash
corepack pnpm test:blind-flange
# or watch mode inside the app package:
corepack pnpm --dir apps/blind-flange-calculator test:watch
```

Best practice:

- Use deterministic input fixtures.
- Include representative DN/PN/material/temperature combinations.
- Assert numeric tolerances explicitly (`toBeCloseTo`).
- Prefer testing shared domain modules over UI orchestration.

## Recommended Next Layers

### Component Tests

Target:

- Input form behavior.
- Results panel rendering.
- Manual check panel state.
- Export button enabled/disabled states.

Recommended tooling:

```text
@testing-library/react
```

### Browser Tests

Target:

- The built app loads from `app.html`.
- Main calculator workflow works in a real browser.
- PDF and STEP export controls do not crash.
- Mobile viewport remains usable.

Recommended tooling:

```text
playwright
```

These remain deferred under bottleneck **B-04** (Mitigated, not fully closed until component/browser layers exist).

## Manual Regression Checklist

Before a release that changes formulas or exports:

1. Standard DN200 / 16 bar / P355GH calculation produces geometry and thickness.
2. Custom auto-sizing returns at least one candidate for a typical nozzle ID.
3. Manual check pass/fail toggles with intentional bad edge clearance.
4. PDF export downloads without console errors.
5. STEP export completes or shows a clear error (no infinite spinner).
6. Configuration JSON round-trip restores inputs.

## Related Docs

- [Bottlenecks and Risks](../architecture/bottlenecks-and-risks.md) (B-04)
- [CI/CD and Deployment](ci-cd-and-deployment.md)
- [Development Workflow](development-workflow.md)
