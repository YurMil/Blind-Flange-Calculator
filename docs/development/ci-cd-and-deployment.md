# CI/CD and Deployment

The repository uses GitHub Actions to validate and publish the standalone static utility app.

## Workflow File

```text
.github/workflows/main.yml
```

The workflow is named:

```text
Blind Flange Calculator CI/CD
```

## Triggers

The workflow runs on:

- Pushes to `main`.
- Pull requests targeting `main`.
- Manual `workflow_dispatch`.

## CI Job

Job:

```text
quality
```

Responsibilities:

1. Check out the repository.
2. Install pnpm.
3. Install Node.js.
4. Install dependencies with a frozen lockfile.
5. Run TypeScript checks.
6. Run unit tests (`pnpm test:blind-flange`).
7. Build the utility app.
8. Validate the generated static artifact.
9. Upload the deployable app as a GitHub Actions artifact.

## Static Artifact Validation

CI validates that the build produced:

```text
static/utility-apps/blind-flange-calculator/app.html
static/utility-apps/blind-flange-calculator/manifest.json
static/utility-apps/blind-flange-calculator/assets/
```

The manifest must include:

- `name: "blind-flange-calculator"`
- `entry: "app.html"`
- a non-empty `assets` array

This prevents publishing incomplete or incorrectly structured static output.

## Deployment Job

Job:

```text
deploy
```

The deployment job runs only when:

```text
github.event_name == 'push' && github.ref == 'refs/heads/main'
```

It downloads the validated static artifact and publishes it to:

```text
Biosxxx/cadautoscript.com
```

Target directory:

```text
static/utility-apps/blind-flange-calculator
```

## Required Secret

The workflow expects:

```text
DEPLOY_TOKEN
```

Best practice:

- Store it as a GitHub Actions repository secret.
- Give it only the permissions required to push to the destination repository.
- Rotate it when maintainers change.
- Never commit tokens to the repository.

## Deployment Model

The source repository builds the app. The website repository receives only the static deployable output:

```text
app.html
manifest.json
assets/
```

This keeps the host website independent from the Vite source app while still allowing the calculator to evolve separately.

## Failure Modes

### Dependency install fails

Likely causes:

- Lockfile is out of sync.
- Package manager version mismatch.
- Registry or network issue.

Fix:

- Run `corepack pnpm install`.
- Commit the updated lockfile if dependency changes are intentional.

### Typecheck fails

Likely causes:

- Invalid TypeScript changes.
- Missing worker or Vite types.
- Incorrect imports after refactoring.

Fix:

- Run `corepack pnpm typecheck:blind-flange` locally.

### Build succeeds but artifact validation fails

Likely causes:

- `vite.config.ts` output path changed.
- `rename-html.mjs` failed.
- `write-manifest.mjs` failed.
- Assets are missing.

Fix:

- Run `corepack pnpm build:blind-flange`.
- Verify `static/utility-apps/blind-flange-calculator`.

### Deployment fails

Likely causes:

- Missing or invalid `DEPLOY_TOKEN`.
- Token lacks push permission.
- Destination repository or branch changed.

Fix:

- Check GitHub Actions secrets.
- Check destination repository permissions.
- Confirm destination branch is `main`.

## CI/CD Best Practices

- Keep deployment dependent on the quality job.
- Keep artifact validation explicit.
- Avoid publishing from pull requests.
- Keep workflow permissions minimal.
- Prefer pinned versions for Node and pnpm.
- Keep CI commands aligned with local developer commands.
