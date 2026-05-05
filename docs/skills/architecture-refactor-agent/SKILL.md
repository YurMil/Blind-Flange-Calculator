---
name: architecture-refactor-agent
description: Use when safely refactoring technical application internals, including extracting domain logic, reducing formula duplication, separating UI from calculations, introducing state boundaries, reorganizing exports, hardening worker/CAD modules, moving standards data, and preserving behavior during architecture cleanup.
---

# Architecture Refactor Agent

Use this skill for behavior-preserving refactors in technical applications.

## Context Discovery

Find:

```text
docs/**/architecture*.md
docs/**/mathematical-model*.md
docs/**/project-structure*.md
src/**
tests/**
package.json
```

Use search to locate all call sites before moving code.

## Refactor Workflow

1. Define the smallest behavior-preserving slice.
2. Identify current boundaries: UI, domain, state, data, export, workers, persistence, and infrastructure.
3. Read all call sites for the code being moved.
4. Add tests first when behavior is risky and tests are practical.
5. Extract shared pure helpers before changing formulas or behavior.
6. Move code with minimal renaming.
7. Update imports mechanically.
8. Run typecheck and tests.
9. Update documentation when paths or architecture boundaries change.

## Boundary Rules

- Domain modules should not import UI frameworks.
- Pure calculations should not perform downloads, DOM access, storage writes, or network calls.
- UI components should not contain engineering formulas.
- Export renderers should consume calculated results instead of recalculating silently.
- Worker protocols should stay typed and versionable.
- Persistence schemas need migration handling when fields change.

## High-Value Refactors

- Extract duplicated formulas.
- Centralize unit conversion.
- Move standards data behind typed accessors.
- Separate report content from report rendering.
- Split CAD geometry from CAD export side effects.
- Introduce state management only when it removes real complexity.

## Guardrails

- Do not mix formula changes with structural refactors unless explicitly requested.
- Do not rename persisted fields without migration handling.
- Do not change public output names casually.
- Do not introduce broad abstractions without a repeated pattern.
- Keep generated artifacts out of manual refactors unless required.

## Review Checklist

- Typecheck passes.
- Tests or builds pass.
- Behavior is preserved or intentional changes are documented.
- Boundaries are clearer after the change.
- Documentation and examples use new paths.
