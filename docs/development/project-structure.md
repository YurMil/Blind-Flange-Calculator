# Project Structure

The repository is organized as a small pnpm workspace with a standalone Vite application and a deployable static artifact.

## Root Files

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
.gitignore
Readm.md
.github/workflows/main.yml
```

### `package.json`

Defines the workspace-level scripts and the expected package manager:

- `dev:blind-flange`
- `build:blind-flange`
- `typecheck:blind-flange`
- `build`
- `typecheck`

Best practice:

- Keep root scripts as orchestration commands.
- Keep app-specific implementation scripts inside the app package.
- Do not add unrelated product logic to root scripts.

### `pnpm-lock.yaml`

Locks the dependency graph for reproducible builds.

Best practice:

- Commit every dependency change together with the lockfile.
- Use `pnpm install --frozen-lockfile` in CI.
- Avoid manual edits.

### `pnpm-workspace.yaml`

Defines workspace packages:

```yaml
packages:
  - apps/*
```

Best practice:

- Add future apps under `apps/`.
- Keep package boundaries explicit.

### `.github/workflows/main.yml`

Runs CI quality gates and deploys the static utility app to the website repository.

Best practice:

- Keep deployment dependent on a successful build.
- Validate generated artifacts before publishing.
- Keep secrets in GitHub Actions secrets, never in the repository.

## Application Folder

```text
apps/blind-flange-calculator/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  scripts/
  src/
```

### `index.html`

The Vite HTML entry point. During build it is emitted and then renamed to `app.html`.

Best practice:

- Keep it minimal.
- Load app code through Vite-managed module entry points.
- Do not hard-code production asset URLs.

### `package.json`

Defines app-specific scripts and dependencies.

Best practice:

- Keep runtime dependencies limited to what the browser app needs.
- Keep build tooling in `devDependencies`.
- Avoid adding a second UI framework unless there is a strong reason.

### `tsconfig.json`

Defines strict TypeScript settings for the app.

Best practice:

- Keep `strict: true`.
- Keep `noEmit: true`; Vite owns JavaScript output.
- Include `WebWorker` types because CAD generation uses worker code.

### `vite.config.ts`

Defines Vite plugins and static output:

```text
../../static/utility-apps/blind-flange-calculator
```

Best practice:

- Keep `base: './'` so assets load correctly from the static utility folder.
- Keep `emptyOutDir: true` to avoid stale assets.
- Keep deployable output under `static/utility-apps/blind-flange-calculator`.

## Build Scripts

```text
apps/blind-flange-calculator/scripts/
  rename-html.mjs
  write-manifest.mjs
```

### `rename-html.mjs`

Renames Vite output from `index.html` to `app.html`.

Best practice:

- Keep this script deterministic.
- Fail the build if the expected file is missing.

### `write-manifest.mjs`

Writes a deploy manifest with app name, version, build time, entry file, and asset list.

Best practice:

- Keep the manifest small and machine-readable.
- Use it for deployment diagnostics and future release verification.

## Source Folder

```text
src/
  main.tsx
  App.tsx
  BlindFlangeCalculator.tsx
  components/
  cad/
  history/
  *.ts
  styles.css
```

Best practice:

- Keep React UI components in `components/`.
- Keep CAD logic under `cad/`.
- Keep persistence code under `history/` or a future `state/` folder.
- Move pure calculation code toward a future `domain/` folder as the app grows.

## Static Artifact Folder

```text
static/utility-apps/blind-flange-calculator/
  app.html
  manifest.json
  assets/
```

This folder contains the built app that the host website can serve.

Best practice:

- Treat this folder as generated output.
- Do not edit built assets manually.
- Regenerate it with `corepack pnpm build:blind-flange`.
