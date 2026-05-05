---
name: engineering-react-ui
description: Use when building, reviewing, or improving React user interfaces for engineering, CAD, scientific, financial, operational, or standards-driven technical applications, including dense input forms, validation states, result panels, unit labels, warnings, export controls, responsive layouts, accessibility, and user trust in calculated outputs.
---

# Engineering React UI

Use this skill for technical React interfaces where users enter precise data and inspect calculated results.

## Context Discovery

Find:

```text
src/**/*.{tsx,jsx}
src/**/components/**
src/**/styles.*
src/**/state/**
src/**/domain/**
docs/**/mathematical-model*.md
docs/**/application-architecture*.md
```

## Workflow

1. Identify the user workflow: input, validation, calculation review, comparison, export, history, or visualization.
2. Trace every displayed technical value to its source.
3. Keep calculations out of render logic.
4. Keep units visible and unambiguous.
5. Make invalid, approximate, warning, and failure states explicit.
6. Keep controls stable and usable on mobile and desktop.
7. Verify keyboard and pointer interaction.
8. Run typecheck and build after substantial UI changes.

## UI Rules

- Favor dense but organized layouts for engineering tools.
- Use clear labels, unit suffixes, and compact summaries.
- Show assumptions and warnings near affected results.
- Disable or guard export actions when prerequisites are missing.
- Avoid decorative layouts that hide technical priority.
- Keep result cards, tables, and panels visually stable.
- Ensure text fits inside controls across responsive widths.

## Technical Display Checklist

- Inputs show units.
- Derived values show basis or source when relevant.
- Pass/fail criteria are explainable.
- Warnings are not hidden behind low-contrast styling.
- Exported values match displayed values.
- Empty and error states are actionable.

## Review Checklist

- No new formulas in UI components.
- State updates do not create stale results.
- Validation messages are specific.
- Accessibility basics are preserved.
- Mobile and iframe/subpath usage remain practical when relevant.
