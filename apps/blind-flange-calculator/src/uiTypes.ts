import type {ReactNode} from 'react';

/**
 * UI-only prop types that reach into React. Kept out of `src/domain/` so the
 * domain layer (calculations/standards/types) stays framework-free. See B-10
 * in `docs/architecture/bottlenecks-and-risks.md`.
 */
export interface ResultCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  highlight?: boolean;
}
