---
name: engineering-standards-data
description: Use when adding, correcting, validating, or documenting standards-driven engineering data in software, including material property tables, dimensional standards, fastener catalogs, gasket factors, allowable values, lookup tables, standard sizes, source traceability, placeholder data, and migration of persisted identifiers.
---

# Engineering Standards Data

Use this skill for standards tables, engineering catalogs, lookup data, and traceability work.

## Context Discovery

Find the target project's data sources:

```text
src/**/data.*
src/**/standards/**
src/**/materials/**
src/**/fasteners/**
src/**/gaskets/**
src/**/catalog*
src/**/types.*
docs/**/mathematical-model*.md
docs/**/standards*.md
```

## Workflow

1. Identify the exact data set being changed.
2. Identify the source standard, supplier document, project specification, or assumption.
3. Check every consumer: calculations, UI labels, CAD, exports, persistence, tests, and documentation.
4. Update types and enum values when adding new IDs.
5. Keep stable IDs backward compatible when configurations may be persisted.
6. Mark incomplete, estimated, or placeholder data explicitly.
7. Add or update test fixtures for critical lookup behavior.
8. Update documentation and source notes.

## Data Quality Rules

- Do not add standards values without a source or visible assumption.
- Keep units explicit in field names, comments, or docs.
- Do not let placeholder data pass critical engineering checks.
- Separate EN, ASME, ISO, supplier, and project-specific assumptions.
- Prefer typed accessors over ad hoc table reads when data is used in several places.
- Keep generated or imported data reproducible.

## Traceability Checklist

For every data change, capture:

- source name and edition when available
- table or clause reference when available
- unit system
- valid range
- fallback behavior
- placeholder status
- affected calculations

## Review Checklist

- New data compiles.
- UI can display the new value.
- Calculations handle it safely.
- Exports and reports explain it correctly.
- Tests cover at least one representative use.
- Documentation matches the new dataset.
