# Application Architecture

Blind Flange Calculator is a browser-first engineering utility. The architecture should keep user interface code, engineering calculations, CAD generation, exports, and generated static deployment artifacts separated.

## Current High-Level Flow

```text
User input
  -> React components
  -> calculation and standards modules
  -> results, manual checks, export panels
  -> PDF/JSON/STEP output
  -> static build artifact
```

## Layer Responsibilities

### UI Layer

Current location:

```text
apps/blind-flange-calculator/src/components/
apps/blind-flange-calculator/src/BlindFlangeCalculator.tsx
apps/blind-flange-calculator/src/App.tsx
```

Responsibilities:

- Render forms, panels, charts, dialogs, and export controls.
- Convert user actions into typed application state updates.
- Present warnings and calculation results clearly.
- Keep layout responsive inside an iframe or standalone browser tab.

Best practice:

- Do not place engineering formulas directly inside components.
- Keep components small enough to test and review.
- Use explicit props and typed callback signatures.
- Keep accessibility in mind for inputs, buttons, dialogs, and keyboard flow.

### Domain Layer

Current files include:

```text
allowables.ts
bfTypes.ts
bolting.ts
custom.ts
data.ts
gasket.ts
manualCheck.ts
manualCheckTypes.ts
utils.ts
```

Responsibilities:

- Store standards data.
- Perform deterministic engineering calculations.
- Validate engineering inputs.
- Format or classify domain results.

Best practice:

- Keep domain functions pure where possible.
- Do not import React.
- Do not access the DOM.
- Do not trigger file downloads.
- Keep units explicit in type names, comments, or field names.

Recommended future structure:

```text
src/domain/
  calculations/
  standards/
  validation/
  types/
```

### CAD Layer

Current location:

```text
src/cad/
  geometry/
  hooks/
  services/
  types/
```

Responsibilities:

- Compute CAD geometry from validated calculator data.
- Build blind flange solids.
- Build bolt hole patterns and facing features.
- Run heavy STEP generation in a Web Worker.
- Expose a UI-friendly hook for export state.

Best practice:

- Keep expensive CAD operations out of the main UI thread.
- Keep worker protocol types explicit.
- Validate geometry before generating CAD.
- Keep CAD code lazy-loadable where possible because WASM payloads are large.

### Export Layer

Current files include:

```text
download.ts
exportUtils.ts
manualPdfReport.ts
pdfText.ts
components/ExportActions.tsx
components/StepExportPanel.tsx
```

Responsibilities:

- Generate PDF reports.
- Export structured configuration data.
- Trigger browser downloads.
- Provide STEP export entry points.

Best practice:

- Keep report content and report rendering separated.
- Keep download side effects near the browser boundary.
- Use stable file naming.
- Avoid duplicating calculation formulas inside export code.

### Persistence Layer

Current location:

```text
src/history/configurationHistoryStore.ts
```

Responsibilities:

- Store local configuration history.
- Restore user configurations.
- Keep browser-only persistence separate from calculations.

Best practice:

- Persist only user preferences and non-sensitive tool data.
- Version stored data if the schema changes.
- Handle corrupt local storage gracefully.

## State Management

The current application uses local React state and focused stores where needed. As the app grows, introduce a single app state boundary only when prop flow becomes difficult to maintain.

Recommended future approach:

- Use a dedicated store for calculator input, UI state, export state, and history.
- Keep derived values computed through selectors or domain functions.
- Do not persist generated binary files.

## Error Handling

Best practice:

- Validate user input before calculation.
- Return typed result objects for recoverable domain issues.
- Use thrown errors only for unexpected states.
- Present CAD and export failures in the UI with actionable messages.

## Performance Rules

- Keep main-thread interactions responsive.
- Use Web Workers for CAD/STEP generation.
- Avoid loading heavy PDF/CAD dependencies until the user needs export actions when practical.
- Keep generated static assets cache-friendly through hashed filenames.

## Architecture Review Checklist

Before merging an architectural change, verify:

- UI components do not contain new engineering formulas.
- Domain modules do not import React or browser-only APIs.
- CAD worker messages are typed.
- Export code reuses calculated results instead of recalculating silently.
- New dependencies are justified and documented.
- CI still validates the static artifact.
