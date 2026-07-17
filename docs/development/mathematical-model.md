# Mathematical Model

This document describes the calculation model currently implemented in the Blind Flange Calculator application.

The model is implemented mainly in:

```text
apps/blind-flange-calculator/src/domain/calculations/utils.ts
apps/blind-flange-calculator/src/domain/calculations/custom.ts
apps/blind-flange-calculator/src/domain/calculations/manualCheck.ts
apps/blind-flange-calculator/src/domain/calculations/allowables.ts
apps/blind-flange-calculator/src/domain/calculations/bolting.ts
apps/blind-flange-calculator/src/domain/calculations/gasket.ts
apps/blind-flange-calculator/src/domain/standards/data.ts
```

(See [B-10](../architecture/bottlenecks-and-risks.md#b-10--domain-layer-not-physically-isolated) — these now live under `src/domain/`.)

## Scope

The application estimates blind flange geometry, required plate thickness, bolting adequacy, bolt torque, hydrotest pressure, gasket loads, deflection, stress, and weight.

It supports three calculation paths:

- Standard geometry calculation from the EN 1092 dimension table.
- Custom auto-sizing by iterating bolt counts and bolt sizes.
- Manual check of a user-defined geometry.

## Important Engineering Note

The model is a sizing and screening tool. It combines standards-based lookup data with simplified analytical checks and implementation-specific heuristics. Final pressure equipment design must be verified against the project specification, applicable code edition, certified material data, gasket supplier data, bolt supplier data, and responsible engineer review.

## Units

The code uses the following internal units:

| Quantity | Unit |
| --- | --- |
| Diameter, width, thickness, radius | mm |
| Pressure input | bar |
| Pressure in formulas | MPa |
| Force | N |
| Stress and allowable stress | MPa, equivalent to N/mm2 |
| Moment | N*mm |
| Density in material table | g/cm3 style numeric value, converted in weight formula |
| Weight result | kg |
| Torque | N*m |

Pressure conversion:

```text
P_MPa = P_bar * 0.1
```

## Input Variables

Main input values:

```text
dn                    Nominal diameter
pressureOp            Operating/design pressure, bar
pressureTest          User-entered hydrotest pressure, bar
temperature           Design temperature, deg C
material              Material id
corrosionAllowance    Corrosion allowance, mm
gasketMaterial        Gasket material id
gasketThickness       Gasket thickness, mm
gasketFacing          RF, FF, or IBC
frictionPreset        dry or lubricated
fastenerStandard      EN or ASME
fastenerType          BOLT or STUD
fastenerGradeId       Fastener grade catalog id
```

Custom geometry inputs:

```text
customOuterDiameter       D, mm
customNozzleId            gasket/nozzle inside diameter reference, mm
customBoltCircle          k, mm
customBoltCount           number of bolts
customBoltSize            metric bolt size, for example M24
customBoltHoleDiameter    bolt hole diameter, mm
customGasketOd            gasket outside diameter, mm
```

## Material Model

Material data is defined in `MATERIALS`.

Each material has:

```text
yieldByTemp: {temperature_C: yield_MPa}
density
modulusElasticity optional
```

If `modulusElasticity` is not defined, the model uses:

```text
E = 200000 MPa
```

Poisson ratio is hard-coded in plate physics checks:

```text
nu = 0.3
```

### Yield Selection by Temperature

The application does not interpolate linearly. It selects the greatest listed temperature that is less than or equal to the requested temperature.

For a material table with temperatures:

```text
20, 100, 150, 200
```

At `temperature = 175 deg C`, the selected yield is the value at `150 deg C`.

If no data exists, fallback yield is:

```text
150 MPa
```

## Allowable Stress

Allowable stress is calculated from yield strength and a safety factor:

```text
S = Re_T / gamma
```

Where:

```text
S       allowable stress, MPa
Re_T    selected yield strength at temperature, MPa
gamma   safety factor
```

Safety factors:

| Code | Operating gamma | Test gamma |
| --- | ---: | ---: |
| EN | 1.5 | 1.05 |
| ASME | 1.5 | 1.1 |

The standard calculation path uses EN allowables:

```text
S_op   = allowable at design temperature, operating usage
S_test = allowable at 20 deg C, test usage
```

## Hydrotest Pressure

Hydrotest pressure is calculated in `getHydroTestPressure`.

For EN 13445:

```text
P_test = max(1.25 * P_design * ratio, 1.43 * P_design)
```

For ASME VIII:

```text
P_test = 1.3 * P_design * ratio
```

Where:

```text
ratio = S_test / S_design
```

The final hydrotest pressure is clamped so it is not below operating pressure:

```text
P_test_final = max(P_test, P_op)
```

If the user provides a positive test pressure, the calculation uses:

```text
pressureTestUsed = max(userPressureTest, pressureOp)
```

Otherwise it uses:

```text
pressureTestUsed = max(autoHydroPressure, pressureOp)
```

## PN Selection

The standard calculation maps operating pressure to a target PN class:

| Operating pressure, bar | Target PN |
| ---: | ---: |
| `P <= 10` | PN 10 |
| `P <= 16` | PN 16 |
| `P <= 25` | PN 25 |
| `P <= 40` | PN 40 |
| `P <= 63` | PN 63 |
| `P <= 100` | PN 100 |
| `P <= 160` | PN 160 |
| `P <= 250` | PN 250 |
| `P <= 320` | PN 320 |
| otherwise | PN 400 |

For standard mode, the application selects the first available EN 1092 PN class for the DN that is greater than or equal to the target PN.

```text
selectedPN = first available PN where availablePN >= targetPN
```

If no such PN exists for the selected DN, the calculation returns no result.

## EN 1092 Geometry

The EN 1092 table stores:

```text
D      outer flange diameter, mm
k      bolt circle diameter, mm
bolts  bolt count
size   bolt size
d2     bolt hole diameter, mm
```

For custom mode, the same shape is built from user-provided geometry.

## Gasket Geometry

Gasket properties are defined by material, facing, thickness, DN, and PN.

### Standard Gasket Width

The raw gasket width is:

```text
rawWidth = dn * 0.08 + 6
```

Adjustment factors:

```text
pnFactor =
  1.15 if PN >= 320
  1.10 if PN >= 250
  1.05 if PN >= 160
  1.00 otherwise

facingFactor =
  1.10 for FF
  0.95 for IBC
  1.00 for RF

thicknessFactor =
  1.08 if gasket thickness >= 3 mm
  1.00 otherwise
```

Final gasket width:

```text
width = clamp(rawWidth * pnFactor * facingFactor * thicknessFactor, 8, 32)
```

Standard gasket inside diameter:

```text
id = max(10, dn - 6)
```

Standard gasket outside diameter:

```text
od = id + 2 * width
```

Effective gasket width:

```text
b = clamp(width * 0.8, 6, 25)
```

Effective gasket diameter:

```text
G = (id + od) / 2
```

### Custom Gasket Geometry

Custom gasket input is normalized:

```text
safeId = max(1, id)
safeOd = max(safeId + 2, od)
width = (safeOd - safeId) / 2
b = clamp(width * 0.8, 6, 25)
G = (safeId + safeOd) / 2
```

### Gasket Material Factors

The implemented gasket material factors are:

| Material | m | y, MPa |
| --- | ---: | ---: |
| graphite | 3.0 | 40 |
| tesnitBA50 | 2.5 | 35 |
| ptfe | 3.5 | 50 |

## Pressure Area and Pressure Force

The pressure diameter is:

```text
Dp = gasket.id if available, otherwise gasket.effectiveDiameter
```

Pressure area:

```text
A_p = pi * (Dp / 2)^2
```

Operating pressure force:

```text
F_op = A_p * P_op_MPa
```

Hydrotest pressure force:

```text
F_test = A_p * P_test_MPa
```

Because `MPa = N/mm2`, this directly returns force in N.

## Gasket Bolt Loads

Implemented in `calcRequiredBoltLoads`.

Variables:

```text
G        effective gasket diameter, mm
b        effective gasket width, mm
m        gasket factor
y        gasket seating stress, MPa
P_op     operating pressure, MPa
P_test   hydrotest pressure, MPa
```

Seating load:

```text
Wm1 = pi * G * b * y
```

Operating load:

```text
Wm2_op = (pi * G^2 * P_op) / 4 + 2 * pi * b * G * m * P_op
```

Hydrotest load:

```text
Wm2_hydro = (pi * G^2 * P_test) / 4 + 2 * pi * b * G * m * P_test
```

The governing bolting case is the case with the greatest required bolt area.

## Bolt Geometry

Metric bolt stress area is looked up from `BOLT_STRESS_AREA`.

Bolt hole diameter is looked up from `BOLT_HOLE_DIAMETER`.

Thread pitch is looked up from `METRIC_PITCH`.

For ASME fasteners, the current geometry model still uses metric thread geometry and records that as an assumption.

## Fastener Strength

Fastener catalog entries define:

```text
proofStressMPa
yieldStressMPa
allowableOp
allowableTest
```

Some grades have diameter-dependent proof and yield values. If a size-dependent table exists, the application selects the first row where:

```text
boltDiameter <= maxDiaMm
```

Otherwise it uses the catalog default.

If allowable values are not explicit, they are derived from proof stress:

```text
allowableOp   = proof / 1.5
allowableTest = proof / 1.1
```

Placeholder fasteners are not allowed to pass bolting checks.

## Bolt Area Check

Provided bolt tensile area:

```text
A_provided = boltCount * stressArea
```

Required areas:

```text
A_req_seating = Wm1 / S_bolt
A_req_oper    = Wm2_op / S_bolt
A_req_hydro   = Wm2_hydro / S_bolt
```

Governing required area:

```text
A_req = max(A_req_seating, A_req_oper, A_req_hydro)
```

Bolting passes when:

```text
A_provided >= A_req_seating
A_provided >= A_req_oper
A_provided >= A_req_hydro
```

## Bolt Torque

The application currently uses a K-factor torque model.

Friction factors:

| Preset | K | Kmin | Kmax |
| --- | ---: | ---: | ---: |
| dry | 0.20 | 0.18 | 0.22 |
| lubricated | 0.15 | 0.13 | 0.17 |

Required preload per bolt:

```text
F_preload_required = W_governing / boltCount
```

Proof load per bolt:

```text
F_proof = stressArea * proofStress
```

Preload cap:

```text
F_cap = 0.7 * F_proof
```

Actual preload used for torque:

```text
F_preload = min(F_preload_required, F_cap)
```

Torque:

```text
T = K * F_preload * d_m
```

Where:

```text
d_m = boltDiameterMm / 1000
```

Torque range:

```text
T_min = Kmin * F_preload * d_m
T_max = Kmax * F_preload * d_m
```

Preload utilization:

```text
utilization = F_preload / F_proof
```

## Lever Arm

For standard and custom sizing:

```text
h = max((k - G) / 2, 4)
```

For manual check:

```text
h_raw = (k - G) / 2
h = max(h_raw, 0)
```

Where:

```text
k   bolt circle diameter, mm
G   effective gasket diameter, mm
h   lever arm, mm
```

## Thickness Model

The implemented required thickness combines four checks:

- ASME-like moment strength check.
- EN-like moment strength check with coefficient `C_en = 0.95` in custom/manual paths.
- Plasticity check at hydrotest pressure.
- Stiffness check at operating pressure.

The selected minimum required thickness is:

```text
t_min = max(t_asme, t_en, t_plasticity, t_stiffness)
```

In the standard mode in `utils.ts`, the main strength check is calculated directly from operating and hydrotest moments without reporting the separate EN coefficient path:

```text
t_min = max(t_op, t_test, t_plasticity, t_stiffness)
```

### Moment Strength Check

Moment:

```text
M_op   = F_op * h
M_test = F_test * h
```

Operating required thickness:

```text
t_op = sqrt((6 * M_op) / (pi * G * S_op))
```

Hydrotest required thickness:

```text
t_test = sqrt((6 * M_test) / (pi * G * S_test))
```

ASME-like required thickness:

```text
t_asme = max(t_op, t_test)
```

EN-like path in custom/manual checks applies:

```text
C_en = 0.95
M_en = F * h * C_en
```

Then the same square-root thickness equation is used.

## Plasticity Check

The model estimates bending stress in a circular plate under pressure:

```text
sigma = (3 * P * R^2 * (3 + nu)) / (8 * t^2)
```

Where:

```text
P      pressure, MPa
R      plate radius, mm, taken as G / 2
t      plate thickness, mm
nu     0.3
sigma  MPa
```

The required thickness to keep stress below the limit is:

```text
t_plasticity = sqrt((3 * P_test * R^2 * (3 + nu)) / (8 * Re_20))
```

Where:

```text
Re_20 = material yield strength at 20 deg C
```

The result reports:

```text
stressTestMPa
yieldAtTestMPa
isPlasticStable = stressTestMPa <= yieldAtTestMPa
```

In standard/custom auto-sizing, `stressTestMPa` is recalculated using the recommended standard thickness.

In manual check, `stressTestMPa` is calculated using the provided manual thickness.

## Stiffness and Deflection Check

The model estimates maximum center deflection using a circular plate stiffness equation.

Plate rigidity:

```text
D_plate = (E * t^3) / (12 * (1 - nu^2))
```

Deflection:

```text
w = ((5 + nu) * P * R^4) / (64 * D_plate * (1 + nu))
```

The inverse required thickness for a deflection limit is:

```text
t_stiffness = cbrt(
  ((5 + nu) * P_op * R^4 * 12 * (1 - nu^2)) /
  (64 * E * w_limit * (1 + nu))
)
```

Current hard-coded deflection limit:

```text
w_limit = 1.0 mm
```

Standard/custom auto-sizing uses corroded recommended thickness for reported deflection:

```text
t_deflection_report = max(0, recommendedThickness - corrosionAllowance)
```

Manual check uses:

```text
t_corroded = max(0, manualThickness - corrosionAllowance)
```

## Corrosion Allowance and Recommended Thickness

The base required thickness does not include corrosion allowance:

```text
t_min = governing required structural thickness
```

Final required thickness:

```text
t_final = t_min + corrosionAllowance
```

Recommended plate thickness is the first value in `STANDARD_THICKNESSES` that is greater than or equal to `t_final`.

If no standard thickness is large enough:

```text
recommendedThickness = ceil(t_final)
```

Current standard thickness list:

```text
6, 8, 10, 12, 14, 15, 16, 18, 20, 22, 25, 28, 30, 35, 40,
45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150
```

## Weight Calculation

The model approximates the blind flange as a solid circular plate using the selected outer diameter and recommended thickness.

```text
weight = pi * (D / 2000)^2 * (t / 1000) * density * 1000
```

Where:

```text
D        outside diameter, mm
t        recommended thickness, mm
density  material density from MATERIALS
weight   kg
```

The formula does not subtract bolt holes, raised faces, gasket grooves, or other machined features.

## Custom Auto-Sizing Model

Custom auto-sizing iterates over candidate bolt counts and bolt sizes:

```text
boltCounts = 4, 8, 12, 16, 20, 24, 28, 32, 36
boltSizes  = M16, M20, M24, M27, M30, M33, M36, M39,
             M42, M45, M48, M52, M56, M60, M64
```

For each candidate, the application calculates:

1. Bolt geometry.
2. Hole diameter.
3. Bolt circle.
4. Lever arm.
5. Gasket loads.
6. Bolt area check.
7. Outer diameter.
8. Required thickness.
9. Recommended thickness.
10. Weight.
11. Torque.

Candidates that fail bolting checks are rejected.

### Candidate Bolt Circle

The required chord between adjacent holes is:

```text
ligament = max(8, boltDiameter * 0.35)
requiredChord = holeDiameter + ligament
```

Bolt circle required by hole spacing:

```text
k_by_holes = 2 * (requiredChord / (2 * sin(pi / boltCount)))
```

Raw bolt circle:

```text
k_raw = max(k_by_holes, gasketOd + 12)
```

The model also clamps to a minimum standard bolt circle for the DN when available:

```text
k = max(k_raw, minStandardBoltCircle)
```

`minStandardBoltCircle` is normally PN 400 `k` for the DN if available. Otherwise it is the maximum `k` found in the EN 1092 rows for that DN.

### Candidate Outer Diameter

Edge margin:

```text
edgeMargin = boltDiameter * 1.5
```

Outer diameter from bolting:

```text
D_by_bolting = k + 2 * (edgeMargin + holeDiameter / 2)
```

Final candidate outer diameter:

```text
D = max(D_by_bolting, dn + 120, G + 100)
```

The stored candidate `D` and `k` are rounded to whole millimeters.

### Candidate Selection

If preference is `min_weight`, candidates are sorted by:

1. Lower weight.
2. Lower recommended thickness.
3. Lower bolt count.

If preference is `min_bolts`, candidates are sorted by:

1. Lower bolt count.
2. Lower weight.
3. Lower recommended thickness.

The first sorted candidate is selected.

## Manual Geometry Checks

Manual check validates geometry before strength checks.

### Gasket Clearance

```text
gasketNeed = gasketOd + 2 * EDGE_CLEARANCE_MIN_MM
gasketOk = k >= gasketNeed
```

Current constant:

```text
EDGE_CLEARANCE_MIN_MM = 3
```

### Edge Clearance

The fastener feature outside diameter is taken from washer OD, nut across corners, or an approximation.

```text
edgeNeed = k / 2 + featureOD / 2 + EDGE_CLEARANCE_MIN_MM
edgeOk = edgeNeed <= D / 2
```

### Bolt Spacing

Pitch on bolt circle:

```text
s = pi * k / boltCount
```

Minimum pitch:

```text
pitchNeed = featureOD + FASTENER_GAP_MIN_MM
```

Current constant:

```text
FASTENER_GAP_MIN_MM = 2
```

Spacing passes when:

```text
s >= pitchNeed
```

## Manual Check Pass Criteria

Manual check passes only when all required checks pass:

```text
no validation errors
geometry edge check passes
geometry spacing check passes
geometry gasket clearance passes
bolting check passes
manual thickness >= requiredWithCA
```

Where:

```text
requiredWithCA = max(t_asme, t_en, t_plasticity, t_stiffness) + corrosionAllowance
```

The manual result reports the governing thickness criterion:

```text
ASME
EN
Plasticity
Stiffness
```

## Standard Calculation Output

The standard calculation returns:

```text
dims
selectedPN
pressureTestUsed
pressureTestAuto
pressureTestBasis
pressureTestRatio
pressureTestClamped
gasketDiameter
gasketWidth
gasketId
gasketOd
allowableStressOp
allowableStressTest
minThickness
finalThickness
recommendedThickness
weight
gasketMeanDiameter
boltTorque
boltingSummary
deflectionMm
stressTestMPa
yieldAtTestMPa
isPlasticStable
```

## Model Limitations

Known limitations of the implemented model:

- Material yield values are selected by nearest lower table temperature, not interpolated.
- Some standards data is embedded directly in source tables.
- Gasket geometry is simplified and generated from heuristics, not supplier-specific dimensions.
- The plate model is simplified and uses a fixed Poisson ratio of 0.3.
- The stiffness limit is a hard-coded 1.0 mm heuristic.
- Weight does not subtract holes or machined features.
- Torque calculation uses a simple K-factor model.
- ASME fastener geometry currently uses metric-thread assumptions where applicable.
- Custom auto-sizing optimizes only over predefined metric bolt sizes and bolt counts.

## Recommended Improvements

Recommended future improvements:

- Move duplicated plate physics formulas into one shared domain module.
- Add unit tests for all formulas with fixed numerical fixtures.
- Add source references for every standards table.
- Add optional linear interpolation for material yield values.
- Make deflection limit configurable.
- Add supplier-specific gasket datasets.
- Add hole-subtracted and feature-aware weight calculation.
- Add a more detailed torque model if project requirements need it.
- Add explicit engineering assumptions to generated PDF reports.
