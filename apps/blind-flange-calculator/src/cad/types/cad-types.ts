import type {CalculationResult, DesignConfiguration, GasketFacing} from '../../domain/types/bfTypes';
import type {ManualCheckResult} from '../../domain/types/manualCheckTypes';

export type BlindFlangeFacingType = 'FF' | 'RF' | 'RTJ' | 'CUSTOM';

export type BlindFlangeCadGeometry = {
  outerDiameter: number;
  thickness: number;
  boltCircleDiameter: number;
  boltHoleCount: number;
  boltHoleDiameter: number;
  boltSize?: string;
  gasketId?: number;
  gasketOd?: number;
  facingType?: BlindFlangeFacingType;
  /** Screening PN / pressure-class hint used for RF height selection. */
  pressureClassHint?: number;
  raisedFaceHeight?: number;
  raisedFaceDiameter?: number;
  /** RTJ groove pitch diameter (centerline of ring groove), mm. */
  rtjPitchDiameter?: number;
  /** RTJ rectangular groove width approximation, mm. */
  rtjGrooveWidth?: number;
  /** RTJ rectangular groove depth approximation, mm. */
  rtjGrooveDepth?: number;
  source: 'manual' | 'design' | 'custom' | 'standard';
};

export type BlindFlangeCadSource = {
  manualCheck?: ManualCheckResult | null;
  result?: CalculationResult | null;
  customResult?: CalculationResult | null;
  designConfig?: DesignConfiguration | null;
  gasketFacing?: GasketFacing;
  /** Optional PN / class hint when not available from a calculation result. */
  pressureClassHint?: number;
};

export type BoltHoleCenter = {
  x: number;
  y: number;
};
