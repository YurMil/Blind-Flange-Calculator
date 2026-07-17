# Worked Calculation Examples

Illustrative walkthroughs aligned with the implemented code. For full formula definitions, see the [Mathematical Model](../development/mathematical-model.md).

> Engineering note: examples are for documentation and regression orientation. Project design must still follow the applicable code edition and engineer review.

## Example A — PN Class Selection

**Source:** `getCalculatedPN` in `apps/blind-flange-calculator/src/domain/calculations/utils.ts`

| Operating pressure (bar) | Selected target PN |
| ---: | ---: |
| 10 | 10 |
| 12 | 16 |
| 40 | 40 |
| 41 | 63 |
| 250 | 250 |
| 321 | 400 |

Pseudo-logic:

```text
if P <= 10  -> PN 10
if P <= 16  -> PN 16
...
else        -> PN 400
```

Standard geometry then picks the **lowest available PN ≥ target** for the chosen DN from `EN1092_DB`. If no such class exists for that DN, standard mode cannot resolve dimensions (UI may force custom mode).

### Sample standard call shape

```ts
import { calculateBlindFlange } from './utils';

const result = calculateBlindFlange({
  dn: 200,
  pressureOp: 16,          // bar
  pressureTest: 23,        // bar (or auto-derived hydrotest)
  temperature: 100,        // °C
  material: 'P355GH',
  corrosionAllowance: 1,
  gasketMaterial: 'graphite',
  gasketThickness: 2,
  gasketFacing: 'RF',
  frictionPreset: 'lubricated',
  fastenerStandard: 'EN',
  fastenerType: 'STUD',
  fastenerGradeId: 'EN_ISO898_8_8',
  geometryMode: 'standard',
});
```

Typical outputs (names vary by type definitions): outer diameter `D`, bolt circle `k`, bolt count/size, required thickness candidates, bolting pass/fail, weight, torque.

---

## Example B — Gasket Loads (Wm1 / Wm2)

**Source:** `calcRequiredBoltLoads` in `apps/blind-flange-calculator/src/domain/calculations/bolting.ts`

Given effective gasket diameter `G` (mm), effective width `b` (mm), factors `m` and `y`, and pressures in bar:

```text
P_op   = pressureOp   * 0.1     // MPa
P_test = pressureTest * 0.1     // MPa

Wm1       = π · G · b · y
Wm2_op    = (π · G² · P_op) / 4   + 2 · π · b · G · m · P_op
Wm2_hydro = (π · G² · P_test) / 4 + 2 · π · b · G · m · P_test
```

Numeric sketch (not a certified case):

```text
G = 250 mm, b = 12 mm, m = 2.0, y = 11 MPa
pressureOp = 16 bar  -> P_op = 1.6 MPa

Wm1    ≈ π · 250 · 12 · 11
Wm2_op ≈ (π · 250² · 1.6) / 4 + 2 · π · 12 · 250 · 2.0 · 1.6
```

Bolt area checks then require:

```text
A_required_case = W_case / S_bolt
provided        = n_bolts · stress_area
pass if provided >= each required case
```

Governing case is the maximum of seating, operating, and hydrotest required areas (`calcBoltAreaChecks`).

---

## Example C — Allowable Stress

**Source:** `getAllowableStress` in `apps/blind-flange-calculator/src/domain/calculations/allowables.ts`

```text
S = Re_T / gamma
```

| Context | gamma (EN) | gamma (ASME path) |
| --- | ---: | ---: |
| Operating | 1.5 | 1.5 |
| Test | 1.05 | 1.1 |

`Re_T` is taken from the material `yieldByTemp` table as the **greatest listed temperature ≤ design temperature** (no interpolation).

Example: temperatures `{20, 100, 150, 200}`. At 175 °C the code uses the 150 °C yield.

---

## Example D — Custom Auto-Sizing Search

**Source:** `calculateCustomBlindFlange` in `apps/blind-flange-calculator/src/domain/calculations/custom.ts`

Algorithm outline:

```text
for each candidate bolt count in catalog set:
  for each candidate metric bolt size:
    derive bolt circle from ligament / chord geometry
    derive outer diameter from edge margin rules
    evaluate gasket, loads, thickness, weight, torque
    keep candidate if bolting checks pass
sort survivors by preference:
  min_weight  or  min_bolts
return best candidate (+ closest-failure diagnostics if empty)
```

This is a discrete brute-force search (on the order of ~100+ evaluations per run), suitable for interactive browser use.

---

## Example E — Manual Geometry Gate

**Source:** `runManualCheck` in `apps/blind-flange-calculator/src/domain/calculations/manualCheck.ts`

Checks include (among others):

- Minimum edge clearance (~3 mm)
- Fastener gap / bolt spacing (~2 mm feature gap rules)
- Gasket clearance relative to bolt circle and OD
- Thickness adequacy vs ASME-like / EN-like / plasticity / stiffness requirements
- Stress and deflection utilization against the declared thickness

Overall pass requires all sub-check groups to pass.

---

## Example F — Configuration Round-Trip

The UI builds a versioned configuration object:

```json
{
  "schema": "blind-flange-calculator-config",
  "version": 1,
  "dn": 200,
  "pressureOp": 16,
  "temperature": 100,
  "material": "P355GH",
  "geometryMode": "standard"
}
```

Export/import is handled in `ConfigJsonActions.tsx` with defensive parsing. Live changes can autosave to IndexedDB via `configurationHistoryStore.ts` (debounced).

Schema migration is not yet implemented — see bottleneck **B-08** in [Bottlenecks and Risks](../architecture/bottlenecks-and-risks.md).

---

## Where to Dig Deeper

| Topic | Document / code |
| --- | --- |
| Full formula set | [Mathematical Model](../development/mathematical-model.md) |
| Module locations | [Codebase Map](../architecture/codebase-map.md) |
| Known model / architecture debt | [Bottlenecks and Risks](../architecture/bottlenecks-and-risks.md) |
| STEP geometry | `src/cad/**` and the STEP planning doc under `docs/` |
