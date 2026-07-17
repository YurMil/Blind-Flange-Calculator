# Future Development Roadmap

This roadmap lists recommended improvements for long-term development. It is intentionally technical and focused on maintainability.

Detailed bottleneck inventory (IDs **B-01** … **B-11**): [Bottlenecks and Risks](../architecture/bottlenecks-and-risks.md). Prefer updating that file when closing an item; keep this roadmap as the prioritized narrative.

## 1. Domain Layer Consolidation

Move calculation and standards code into a dedicated domain folder:

```text
src/domain/
  calculations/
  standards/
  validation/
  types/
```

Goals:

- Make engineering logic independent from React.
- Make unit tests easier.
- Reduce coupling between UI panels and formulas.

## 2. Test Infrastructure

Add unit tests for:

- Standard geometry calculations.
- Custom geometry calculations.
- Manual check logic.
- Gasket and bolting logic.
- CAD geometry validation.

Recommended stack:

```text
vitest
@testing-library/react
playwright
```

## 3. Export Architecture

Separate export responsibilities:

```text
src/export/
  pdf/
  json/
  step/
  download.ts
  fileNames.ts
```

Goals:

- Keep report generation testable.
- Keep file download side effects isolated.
- Avoid recalculation inside export code.

## 4. CAD Worker Hardening

Improve CAD generation by:

- Adding worker timeout handling.
- Returning typed errors.
- Adding progress messages.
- Validating geometry before heavy WASM work.
- Lazy-loading CAD dependencies only when needed.

## 5. Application State Boundary

Introduce a focused state layer if prop passing grows too complex:

```text
src/state/
  defaults.ts
  persistence.ts
  selectors.ts
  useBlindFlangeStore.ts
```

Goals:

- Keep input state, UI state, export state, and history state clear.
- Persist only safe user preferences and configurations.
- Keep generated files out of persistence.

## 6. Documentation Expansion

Already added as a living baseline:

```text
docs/README.md
docs/product/overview.md
docs/algorithms/worked-examples.md
docs/architecture/README.md
docs/architecture/codebase-map.md
docs/architecture/bottlenecks-and-risks.md
README.md
```

Recommended next documents:

```text
docs/adr/
docs/domain/
docs/releases/
docs/testing/
```

High-value additions still missing:

- Architecture Decision Records for major refactors (B-01, B-02, CAD facing).
- Release notes / changelog discipline.
- Dedicated standards provenance appendix once `data.ts` citations are filled in.

## 7. Conventional Repository Files

`README.md` is now the primary entry point. Still useful for multi-contributor hygiene:

```text
CONTRIBUTING.md
CHANGELOG.md
SECURITY.md
CODEOWNERS
.editorconfig
.env.example
```
## 8. Release Artifacts

Future releases should include:

```text
app.html
manifest.json
assets/
checksums.json
release-notes.md
```

Goals:

- Verify artifact integrity.
- Make deployments reproducible.
- Enable rollback to a known static build.

## 9. Separate Repository Option

When the app boundary is stable, move the Vite app into a dedicated repository:

```text
biosxxx/blind-flange-calculator-app
```

The host website can then consume release artifacts rather than source code.

Recommended model:

- Build in the app repository.
- Publish a versioned GitHub release artifact.
- Sync the artifact into the website repository.
- Verify checksums before deployment.

## 10. Quality Gate Expansion

Recommended future CI sequence:

```text
install
typecheck
unit tests
component tests
production build
static artifact validation
browser smoke test
upload artifact
deploy on main
```

Keep each gate explicit so failures are easy to diagnose.
