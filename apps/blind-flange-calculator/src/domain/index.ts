/**
 * Public entry point for the domain layer (calculations + standards data).
 * This layer must stay framework-free: no React, no browser download/CAD/
 * history APIs. See B-10 in `docs/architecture/bottlenecks-and-risks.md`.
 *
 * Consumers outside `domain/` (components, state, cad, export) should prefer
 * importing from here; deep imports into `domain/calculations/*`,
 * `domain/standards/*`, or `domain/types/*` remain available when a narrower
 * import is clearer.
 */

export * from './types/bfTypes';
export * from './types/manualCheckTypes';

export * from './standards/data';

export * from './calculations/platePhysics';
export * from './calculations/allowables';
export * from './calculations/bolting';
export * from './calculations/gasket';
export * from './calculations/utils';
export * from './calculations/custom';
export * from './calculations/manualCheck';
