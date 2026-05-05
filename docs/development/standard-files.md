# Standard Files and Best Practices

This document describes the standard files expected in a maintainable standalone browser engineering application like Blind Flange Calculator.

## Required Repository Files

### `Readm.md`

Root project entry point with links to developer documentation and common commands.

Best practice:

- Keep it short.
- Link to detailed documents instead of duplicating them.
- Include the exact commands needed for development, typechecking, and build.

Recommended future improvement:

- Add `README.md` as the conventional GitHub entry point if external contributors will use the repository. `Readm.md` exists because it was explicitly requested for this repository.

### `.gitignore`

Excludes generated files, dependencies, logs, and local environment artifacts.

Best practice:

- Ignore `node_modules/`.
- Ignore local logs and temporary files.
- Do not ignore source files, lockfiles, or CI configuration.

Recommended future entries:

```gitignore
.env
.env.*
!.env.example
coverage/
playwright-report/
test-results/
dist/
```

### `package.json`

Defines project scripts, package manager, and Node engine.

Best practice:

- Use root scripts for orchestration.
- Use app scripts for app internals.
- Pin the package manager through `packageManager`.
- Keep the Node engine aligned with CI.

### `pnpm-lock.yaml`

Provides deterministic dependency resolution.

Best practice:

- Always commit it.
- Regenerate it only through pnpm.
- Review large lockfile changes carefully.

### `pnpm-workspace.yaml`

Defines the monorepo package boundaries.

Best practice:

- Keep package discovery explicit.
- Avoid broad patterns that accidentally include generated folders.

## Required Application Files

### `apps/blind-flange-calculator/package.json`

Defines the app package.

Best practice:

- Use a scoped private package name.
- Keep app scripts simple: `dev`, `build`, `typecheck`.
- Separate runtime dependencies from build dependencies.

### `apps/blind-flange-calculator/index.html`

Defines the browser document shell for Vite.

Best practice:

- Keep the root element stable.
- Avoid inline business logic.
- Keep metadata generic unless the static app is served directly.

### `apps/blind-flange-calculator/vite.config.ts`

Defines build behavior.

Best practice:

- Use `base: './'` for iframe/static utility hosting.
- Keep output deterministic.
- Avoid changing `outDir` without updating CI/CD.
- Keep Web Worker and WASM assets compatible with static hosting.

### `apps/blind-flange-calculator/tsconfig.json`

Defines app-level TypeScript checks.

Best practice:

- Keep strict mode enabled.
- Use bundler module resolution with Vite.
- Keep worker libraries available when workers are part of the app.

### `apps/blind-flange-calculator/src/main.tsx`

React entry point.

Best practice:

- Keep it limited to bootstrapping.
- Do not place calculation logic here.
- Keep global error setup here if added later.

### `apps/blind-flange-calculator/src/App.tsx`

Top-level application component.

Best practice:

- Compose major app regions.
- Avoid large formulas and export implementation details.
- Keep routing or shell-level providers here if introduced later.

### `apps/blind-flange-calculator/src/styles.css`

Global app styles.

Best practice:

- Keep global styles predictable.
- Define reusable CSS variables for spacing, colors, typography, and controls.
- Avoid relying on host website CSS.

## Recommended Future Files

### `CONTRIBUTING.md`

Contributor guide for setup, branch naming, pull requests, testing, and release expectations.

Add this when more than one developer regularly contributes.

### `CHANGELOG.md`

Human-readable release history.

Best practice:

- Use chronological entries.
- Group changes by Added, Changed, Fixed, Removed.
- Link releases or commit ranges when possible.

### `.env.example`

Documents optional local environment variables.

Best practice:

- Include only placeholder values.
- Never commit real credentials.
- Keep it synchronized with runtime configuration.

### `.editorconfig`

Normalizes editor behavior across contributors.

Recommended baseline:

```editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
```

### `CODEOWNERS`

Defines default reviewers for critical areas.

Recommended when:

- CAD logic has dedicated owners.
- Engineering formulas require domain review.
- Deployment workflows require repository owner review.

### `SECURITY.md`

Defines how to report security issues.

Recommended if the app accepts uploaded files, stores user data, or integrates with authenticated services.

### `docs/adr/`

Architecture Decision Records.

Best practice:

- Add one ADR for major architecture decisions.
- Keep ADRs short and dated.
- Record context, decision, consequences, and alternatives.

### `tests/`

Centralized test folder if the project grows beyond colocated tests.

Recommended future layout:

```text
tests/
  unit/
  integration/
  e2e/
  fixtures/
```

## File Naming Rules

- Use kebab-case for documentation files.
- Use PascalCase for React component files.
- Use camelCase for TypeScript utilities when the current codebase already uses that style.
- Use explicit domain names for engineering files, for example `manualCheck.ts`, `gasket.ts`, and `bolting.ts`.
- Avoid ambiguous names such as `helpers.ts` for important domain logic.

## Documentation Rules

- Write documentation in English.
- Keep public commands copy-pasteable.
- Use relative links.
- Update docs in the same change that updates architecture, CI/CD, deployment, or domain behavior.
