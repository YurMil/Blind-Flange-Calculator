---
name: cad-step-export
description: Use when implementing, fixing, reviewing, or documenting CAD and STEP export features in web or Node applications, including parametric geometry, Replicad/OpenCascade, Web Worker protocols, WASM loading, validation, generated solids, bolt/hole patterns, export downloads, and production static asset compatibility.
---

# CAD and STEP Export

Use this skill for parametric CAD generation and STEP export workflows.

## Context Discovery

Locate:

```text
src/**/cad/**
src/**/geometry/**
src/**/workers/**
src/**/worker*
src/**/export/**
src/**/download*
docs/**/cad*.md
docs/**/*step*.md
docs/**/mathematical-model*.md
```

## Workflow

1. Identify the geometry source: user input, validated calculation result, imported model, or design configuration.
2. Validate geometry before invoking CAD generation.
3. Keep heavy CAD/WASM work outside the main UI thread when used in a browser.
4. Keep worker request, progress, success, and failure messages typed.
5. Generate CAD from the same validated values shown in the UI or report.
6. Return user-readable errors for invalid geometry or failed exports.
7. Verify production build output includes required worker and WASM assets.
8. Update CAD/export documentation when assumptions or geometry features change.

## Geometry Guardrails

- Reject zero or negative diameters, thicknesses, radii, and counts.
- Check feature clearance before building solids.
- Avoid duplicating engineering calculations inside CAD modules.
- Keep coordinate systems and units explicit.
- Keep generated filenames deterministic and safe.
- Treat STEP export as a side effect at the boundary, not inside pure geometry functions.

## Worker Guardrails

- Avoid blocking the main UI thread.
- Include timeout or cancellation behavior for long-running jobs when practical.
- Return typed error payloads.
- Avoid relying on dev-server-only paths for WASM or worker chunks.
- Keep asset paths compatible with the production hosting model.

## Review Checklist

- Geometry validation covers impossible inputs.
- Worker protocol handles success and failure.
- Production build can load CAD/WASM assets.
- Exported model matches displayed dimensions.
- Errors are visible and actionable.
- Documentation lists modeling assumptions.
