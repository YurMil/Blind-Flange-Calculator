# Testing and Quality Strategy

The current quality gate is TypeScript plus production build validation. As the app grows, it should add focused unit, integration, and browser tests around the highest-risk areas.

## Current Quality Gates

Local checks:

```bash
corepack pnpm typecheck:blind-flange
corepack pnpm build:blind-flange
```

CI checks:

- Install dependencies with `pnpm install --frozen-lockfile`.
- Typecheck the utility app.
- Build the utility app.
- Validate `app.html`.
- Validate `manifest.json`.
- Validate `assets/`.
- Upload the static app artifact.

## Recommended Test Layers

### Unit Tests

Target:

- Engineering calculations.
- Standards lookup tables.
- Manual checks.
- Geometry validation.
- File naming and export helpers.

Recommended future tooling:

```text
vitest
@testing-library/react
```

Best practice:

- Use deterministic input fixtures.
- Include representative DN/PN/material/temperature combinations.
- Assert numeric tolerances explicitly.
- Keep engineering test cases traceable to a standard clause or project rule when possible.

### Component Tests

Target:

- Input form behavior.
- Results panel rendering.
- Manual check panel state.
- Export button enabled/disabled states.

Best practice:

- Test user-visible behavior rather than implementation details.
- Verify validation messages.
- Verify disabled states for invalid inputs.

### Browser Tests

Target:

- The built app loads from `app.html`.
- Main calculator workflow works in a real browser.
- PDF and STEP export controls do not crash.
- Mobile viewport remains usable.

Recommended future tooling:

```text
playwright
```

Best practice:

- Test the production build, not only the dev server.
- Include desktop and mobile viewport checks.
- Capture screenshots for UI regressions when the layout changes.

### CAD Worker Tests

Target:

- Worker protocol messages.
- Geometry validation.
- STEP generation failure handling.

Best practice:

- Keep worker tests separate from pure domain tests.
- Use small representative geometry cases.
- Verify that errors return typed messages instead of hanging.

## Manual Regression Checklist

Before releasing a meaningful calculation or export change, verify:

- Standard geometry mode.
- Custom geometry mode.
- Automatic PN selection.
- Hydrotest pressure logic.
- Material and allowable stress selection.
- Gasket and bolting calculations.
- Manual check outputs.
- PDF export.
- Configuration JSON export/import.
- STEP export.
- Mobile layout.
- Fullscreen or iframe host usage.

## Quality Rules for Engineering Logic

- Keep formulas centralized.
- Do not duplicate formulas in UI or export code.
- Keep unit conversions explicit.
- Use typed result objects for warnings and failures.
- Add tests when changing a formula, standard table, or validation rule.

## Suggested Future Scripts

When tests are added, use scripts like:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "quality": "pnpm typecheck && pnpm test && pnpm build"
  }
}
```

Root aliases can then delegate to the app package in the same style as the current build and typecheck commands.
