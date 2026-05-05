---
name: vite-static-microapp
description: Use when building, configuring, debugging, or documenting standalone Vite React static microapps, including pnpm/npm/yarn workspaces, Vite output paths, relative assets, generated app manifests, iframe hosting, static publication, app.html entry files, and dependency boundaries from host applications.
---

# Vite Static Microapp

Use this skill for standalone Vite/React applications that are built as static artifacts and embedded or published by another system.

## Context Discovery

Find:

```text
package.json
pnpm-workspace.yaml
yarn.lock or package-lock.json or pnpm-lock.yaml
apps/*/package.json
apps/*/vite.config.*
src/main.*
index.html
scripts/*manifest*
scripts/*rename*
docs/**/architecture*.md
docs/**/deployment*.md
```

## Workflow

1. Identify the app package and the static output contract.
2. Keep local development, typecheck, and build commands clear.
3. Preserve relative asset loading when the app is hosted below a subpath.
4. Keep generated output separate from source.
5. Generate a manifest when another system consumes the static artifact.
6. Validate the artifact before deployment.
7. Keep host-app coupling low: no host aliases, hidden CSS dependencies, or runtime-only globals unless documented.
8. Update documentation and CI if the build contract changes.

## Static Build Contract

A static microapp should usually produce:

```text
entry HTML file
assets directory
optional manifest.json
optional checksums.json
```

The entry HTML may be `index.html`, `app.html`, or a host-specific name. Keep the name documented and validated in CI.

## Vite Guardrails

- Use relative assets for subpath or iframe hosting.
- Avoid hard-coded production URLs unless required.
- Do not manually edit generated bundles.
- Keep worker and WASM assets compatible with production hosting.
- Keep dependency additions minimal and browser-compatible.

## Review Checklist

- Dev command works.
- Typecheck works.
- Production build works.
- Artifact shape matches documentation.
- CI validates the artifact.
- Host integration assumptions are documented.
