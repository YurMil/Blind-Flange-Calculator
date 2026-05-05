---
name: static-app-ci-cd-release
description: Use when configuring, reviewing, debugging, or documenting CI/CD for static web applications and microapps, including GitHub Actions, dependency installation, typecheck/build/test gates, artifact validation, static deployment, repository-to-repository publication, secrets, release artifacts, checksums, rollback, and deployment traceability.
---

# Static App CI/CD and Release

Use this skill for pipelines that build and publish static application artifacts.

## Context Discovery

Find:

```text
.github/workflows/**
package.json
apps/*/package.json
vite.config.*
scripts/*manifest*
scripts/*checksum*
docs/**/ci*.md
docs/**/deployment*.md
docs/**/release*.md
```

## Workflow

1. Identify triggers: pull request, push, tag, release, or manual dispatch.
2. Separate quality jobs from deployment jobs.
3. Install dependencies reproducibly with the lockfile.
4. Run typecheck, tests, and production build before deployment.
5. Validate artifact shape explicitly.
6. Upload artifacts before publishing them.
7. Deploy only from trusted refs.
8. Keep secrets in CI secret storage.
9. Update deployment documentation when the artifact contract changes.

## Artifact Contract

Define and validate:

```text
entry HTML file
assets directory
manifest file if used
checksums file if used
version or source commit metadata
```

Validation should fail the pipeline when required files are missing or manifest fields are wrong.

## Security Rules

- Never commit tokens.
- Keep workflow permissions minimal.
- Do not expose deployment secrets to untrusted pull requests.
- Prefer environment protection for production deployments.
- Keep deploy commits traceable to source SHAs.

## Release Hygiene

- Store build artifacts for debugging.
- Include source SHA in deployment metadata.
- Generate checksums for release bundles when practical.
- Document rollback steps.
- Keep CI commands aligned with local developer commands.

## Review Checklist

- Pull requests cannot deploy.
- Deployment depends on successful quality gates.
- Artifact validation is explicit.
- Secrets are documented but not exposed.
- Target path and branch are documented.
- Failures are easy to diagnose.
