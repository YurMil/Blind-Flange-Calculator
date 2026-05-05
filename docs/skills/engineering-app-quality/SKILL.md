---
name: engineering-app-quality
description: Use when adding, improving, or reviewing quality gates for engineering or technical web applications, including TypeScript checks, unit tests for formulas, component tests, browser tests, CAD worker tests, regression fixtures, numerical tolerances, CI test sequencing, and release confidence.
---

# Engineering App Quality

Use this skill for tests, quality gates, and regression strategy in technical applications.

## Context Discovery

Find:

```text
package.json
apps/*/package.json
vitest.config.*
playwright.config.*
src/**/domain/**
src/**/calculation*
src/**/components/**
tests/**
docs/**/testing*.md
docs/**/mathematical-model*.md
.github/workflows/**
```

## Workflow

1. Identify the risk area: formula, standards data, UI, export, CAD worker, build, deployment, or persistence.
2. Pick the smallest test layer that catches the risk.
3. Use deterministic fixtures for engineering calculations.
4. Use explicit numerical tolerances.
5. Avoid brittle snapshots for technical UIs unless there is a specific rendering contract.
6. Add scripts and CI steps only after the command is stable locally.
7. Document new quality gates.
8. Run the affected checks.

## Recommended Test Layers

Unit tests:

- formulas
- unit conversions
- standards lookup
- validation
- file naming
- pure export content

Component tests:

- forms
- validation states
- result panels
- disabled export states

Browser tests:

- production build loads
- core workflow works
- mobile layout remains usable
- exported files are triggered correctly

Worker tests:

- protocol messages
- timeout/failure behavior
- invalid input handling

## Guardrails

- Do not use random values for engineering regression tests.
- Do not hide test setup inside undocumented global state.
- Do not add CI gates that require unavailable secrets on pull requests.
- Keep fixtures named by scenario and expected governing condition.

## Review Checklist

- Tests cover the actual risk.
- Failure output is diagnosable.
- Local and CI commands match.
- Documentation includes new commands.
- Production build remains validated.
