# Testing and Quality Strategy

The quality gate is TypeScript, Vitest (unit + component), Playwright smoke, production build validation, and static asset budgets.

## Current Quality Gates

Local checks:

```bash
corepack pnpm typecheck:blind-flange
corepack pnpm test:blind-flange
corepack pnpm build:blind-flange
corepack pnpm test:e2e:blind-flange
corepack pnpm check:bundle-budget
```

CI checks (`.github/workflows/main.yml`):

- Install dependencies with `pnpm install --frozen-lockfile`.
- Typecheck the utility app.
- Run Vitest (unit + component).
- Build the utility app.
- Install Playwright Chromium and run smoke e2e against `app.html`.
- Check static asset / WASM budgets.
- Validate `app.html`, `manifest.json`, and `assets/`.
- Upload the static app artifact.

## Unit Tests

Tooling: Vitest (`apps/blind-flange-calculator/vitest.config.ts`).

Coverage under `src/__tests__/` includes plate physics, allowables, calculations, CAD validation, facing features, config migration, and CAD worker errors.

```bash
corepack pnpm test:blind-flange
```

## Component Tests

Tooling:

```text
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
jsdom
```

Current suites:

| Suite | Focus |
| --- | --- |
| `CommittedNumberInput.test.tsx` | Commit-on-blur / invalid revert |
| `InputForm.test.tsx` | Geometry mode toggle, custom fields, warning |
| `ExportActions.test.tsx` | PDF/DXF enabled/disabled states |

Component files use the `*.test.tsx` pattern and run in `jsdom`.

## Browser Smoke Tests

Tooling: Playwright (`apps/blind-flange-calculator/playwright.config.ts`, `e2e/smoke.spec.ts`).

Flow:

1. Serve built `static/utility-apps/blind-flange-calculator/`
2. Open `app.html`
3. Assert calculator heading, PN panel, enabled export controls
4. Switch to custom geometry and assert outer-diameter field

```bash
corepack pnpm build:blind-flange
corepack pnpm --dir apps/blind-flange-calculator exec playwright install chromium
corepack pnpm test:e2e:blind-flange
```

## Manual Regression Checklist

Before a release that changes formulas or exports:

1. Standard DN200 / 16 bar / P355GH calculation produces geometry and thickness.
2. Custom auto-sizing returns at least one candidate for a typical nozzle ID.
3. Manual check pass/fail toggles with intentional bad edge clearance.
4. PDF export downloads without console errors.
5. STEP export completes or shows a clear error/cancel path (RF/RTJ notes visible).
6. Configuration JSON round-trip restores inputs.

## Related Docs

- [Bottlenecks and Risks](../architecture/bottlenecks-and-risks.md) (B-04)
- [CI/CD and Deployment](ci-cd-and-deployment.md)
- [Development Workflow](development-workflow.md)
