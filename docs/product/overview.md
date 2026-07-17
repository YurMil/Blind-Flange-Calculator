# Product Overview

## What the Application Is

Blind Flange Calculator is a browser-based engineering utility for **blind flange sizing, screening checks, reporting, and CAD/STEP export**. It runs as a standalone Vite/React microapp and can be embedded as a static utility on a host site.

Published artifact path:

```text
static/utility-apps/blind-flange-calculator/app.html
```

## Problems It Solves

Pressure-equipment and piping teams often need a fast answer to questions such as:

- Given DN, design pressure, temperature, and material, what EN 1092-1 flange class and bolt pattern apply?
- Is the plate thickness adequate under simplified ASME/EN-style and plasticity/stiffness checks?
- Are bolt area and seating/operating/hydrotest gasket loads adequate for the selected fastener grade?
- If the required PN is outside the embedded table, what custom geometry candidates minimize weight or bolt count?
- Does a proposed manual geometry clear edge, spacing, and gasket rules?
- Can we export a PDF drawing sheet, DXF sketch, configuration JSON, or MVP STEP solid for collaboration?

The application addresses these **screening and documentation** needs in one interactive tool, without requiring a desktop CAD session for first-pass geometry.

## Primary Users

| User | Typical need |
| --- | --- |
| Mechanical / pressure-vessel engineer | Quick sizing and check notes before formal code calculation |
| Piping designer | Standard DN/PN geometry, bolt pattern, weight estimate |
| Project engineer | Shareable PDF / JSON configuration for review meetings |
| CAD / automation engineer | MVP STEP blank for further detailing in CAD |

## Capabilities (In Scope)

1. **Standard mode** — EN 1092-1 dimension lookup by DN and required PN class.
2. **Custom auto-sizing** — search over bolt counts and metric sizes with min-weight or min-bolts preference.
3. **Manual check** — validate a fully user-defined geometry and thickness.
4. **Material / fastener / gasket catalogs** — embedded tables for allowable stress, m/y factors, bolt grades.
5. **Hydrotest pressure helpers** — EN- and ASME-style estimates.
6. **Visualization** — SVG flange schematic.
7. **Exports** — PDF report, DXF, configuration JSON, STEP (flat disk + bolt holes).
8. **Configuration history** — IndexedDB autosave and manual snapshots in the browser.

## Explicit Non-Goals / Limitations

- Not a certified code calculation package or a substitute for stamped design.
- Not a full ASME VIII / EN 13445 flange design module.
- STEP export does not yet model raised face or RTJ grooves (MVP disk only).
- Embedded EN 1092 coverage is finite (DN/PN combinations present in `data.ts`).
- Yield selection uses nearest lower temperature bucket (no linear interpolation).
- No server-side persistence, accounts, or multi-user collaboration.

See [Mathematical Model — limitations](../development/mathematical-model.md) for engineering caveats.

## Value Proposition

| Need | How the app helps |
| --- | --- |
| Speed | Interactive recalculation as inputs change |
| Traceability of inputs | Versioned JSON configuration + local history |
| Communication | PDF with inputs, checks, and a drawing sheet |
| Downstream CAD | Optional STEP via Web Worker (UI stays responsive) |
| Offline-friendly use | Static app; calculations run entirely in the browser |

## Related Documentation

- [Worked Calculation Examples](../algorithms/worked-examples.md)
- [Mathematical Model](../development/mathematical-model.md)
- [Codebase Map](../architecture/codebase-map.md)
- [Bottlenecks and Risks](../architecture/bottlenecks-and-risks.md)
