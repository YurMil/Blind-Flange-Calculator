---
name: engineering-calculation-model
description: Use when implementing, reviewing, debugging, or documenting mathematical and engineering calculation models in software, including unit conversions, formula traceability, material properties, loads, stress checks, stiffness checks, sizing algorithms, safety factors, numerical tolerances, and calculation regression tests.
---

# Engineering Calculation Model

Use this skill for engineering formula changes, calculation reviews, and mathematical model documentation.

## Context Discovery

Before editing formulas, locate the project-specific sources:

```text
README or root project docs
docs/**/mathematical-model*.md
docs/**/architecture*.md
src/**/calculation*.ts
src/**/domain/**
src/**/standards/**
src/**/validation/**
src/**/types/**
tests/**/fixtures/**
```

If the repository has no math model document, create or update one before making large formula changes.

## Workflow

1. Identify the calculation path affected by the task.
2. List all inputs, outputs, units, assumptions, constants, and source standards.
3. Trace unit conversions end to end.
4. Search for duplicated formulas before changing anything.
5. Keep formulas in domain modules, not UI components or export renderers.
6. Update tests or add deterministic fixtures when a formula changes.
7. Update mathematical documentation when assumptions, constants, formulas, or output fields change.
8. Run the target repository's typecheck, tests, and production build when available.

## Guardrails

- Do not silently change safety factors, default material properties, unit systems, or limit criteria.
- Do not mix units inside formulas without explicit conversion.
- Do not duplicate formulas across UI, report, CAD, and domain layers.
- Prefer pure functions for calculations.
- Use explicit numerical tolerances in tests.
- Label heuristic formulas as heuristics.
- Record standard clause references or source documents when available.

## Documentation Checklist

Document:

- formula name and purpose
- inputs and units
- outputs and units
- constants and safety factors
- source standard or engineering assumption
- valid range and known limitations
- examples or regression fixtures

## Review Checklist

- Units are consistent.
- Formula source is traceable.
- Edge cases are handled.
- User-facing outputs still mean what labels say.
- Tests cover representative and boundary cases.
- Documentation matches code.
