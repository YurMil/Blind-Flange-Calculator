import type {CalculationResult, DesignConfiguration, GasketFacing} from '../../domain/types/bfTypes';
import type {ManualCheckResult} from '../../domain/types/manualCheckTypes';
import type {BlindFlangeCadGeometry, BlindFlangeCadSource, BlindFlangeFacingType} from '../types/cad-types';
import {deriveFacingParameters} from './deriveFacingParameters';
import {assertValidBlindFlangeCadGeometry} from './validation';

export const mapFacingType = (gasketFacing?: GasketFacing): BlindFlangeFacingType | undefined => {
  if (gasketFacing === 'FF') return 'FF';
  if (gasketFacing === 'RF') return 'RF';
  if (gasketFacing === 'RTJ') return 'RTJ';
  if (gasketFacing === 'IBC') return 'CUSTOM';
  return undefined;
};

const withFacing = (
  base: Omit<
    BlindFlangeCadGeometry,
    | 'facingType'
    | 'raisedFaceHeight'
    | 'raisedFaceDiameter'
    | 'rtjPitchDiameter'
    | 'rtjGrooveWidth'
    | 'rtjGrooveDepth'
    | 'pressureClassHint'
  > & {pressureClassHint?: number},
  gasketFacing: GasketFacing | undefined,
): BlindFlangeCadGeometry => {
  const facing = deriveFacingParameters({
    facingType: mapFacingType(gasketFacing),
    outerDiameter: base.outerDiameter,
    boltCircleDiameter: base.boltCircleDiameter,
    boltHoleDiameter: base.boltHoleDiameter,
    gasketId: base.gasketId,
    gasketOd: base.gasketOd,
    pressureClassHint: base.pressureClassHint,
  });

  return {
    ...base,
    ...facing,
  };
};

const fromResult = (
  result: CalculationResult,
  gasketFacing: GasketFacing | undefined,
  source: BlindFlangeCadGeometry['source'],
): BlindFlangeCadGeometry =>
  withFacing(
    {
      outerDiameter: result.dims.D,
      thickness: result.recommendedThickness,
      boltCircleDiameter: result.dims.k,
      boltHoleCount: result.dims.bolts,
      boltHoleDiameter: result.dims.d2,
      boltSize: result.dims.size,
      gasketId: result.gasketId,
      gasketOd: result.gasketOd,
      pressureClassHint: result.selectedPN,
      source,
    },
    gasketFacing,
  );

const fromDesignConfig = (
  designConfig: DesignConfiguration,
  gasketFacing: GasketFacing | undefined,
  pressureClassHint?: number,
): BlindFlangeCadGeometry =>
  withFacing(
    {
      outerDiameter: designConfig.outerDiameter,
      thickness: designConfig.thickness,
      boltCircleDiameter: designConfig.boltCircle,
      boltHoleCount: designConfig.boltCount,
      boltHoleDiameter: designConfig.boltHoleDiameter,
      boltSize: designConfig.boltSize,
      gasketId: designConfig.gasketId,
      gasketOd: designConfig.gasketOd,
      pressureClassHint,
      source: 'design',
    },
    gasketFacing,
  );

const fromManualCheck = (
  manualCheck: ManualCheckResult,
  gasketFacing: GasketFacing | undefined,
  pressureClassHint?: number,
): BlindFlangeCadGeometry => {
  const manual = manualCheck.manualInput;

  if (!manual) {
    throw new Error('Manual check result does not include a manual geometry input.');
  }

  const resolvedFacing = manual.gasketFacing ?? manualCheck.gasketSummary?.facing ?? gasketFacing;
  const resolvedGasketId = manualCheck.gasketSummary?.gasketId ?? manual.gasketId;
  const resolvedGasketOd = manualCheck.gasketSummary?.gasketOd ?? manual.gasketOd;

  return withFacing(
    {
      outerDiameter: manual.outerDiameter,
      thickness: manual.thickness,
      boltCircleDiameter: manual.boltCircle,
      boltHoleCount: manual.boltCount,
      boltHoleDiameter: manual.boltHoleDiameter,
      boltSize: manual.boltSize,
      gasketId: resolvedGasketId,
      gasketOd: resolvedGasketOd,
      pressureClassHint,
      source: 'manual',
    },
    resolvedFacing,
  );
};

export const computeBlindFlangeCadGeometry = (source: BlindFlangeCadSource): BlindFlangeCadGeometry => {
  let geometry: BlindFlangeCadGeometry | null = null;
  const pressureHint =
    source.pressureClassHint ??
    source.customResult?.selectedPN ??
    source.result?.selectedPN;

  if (source.manualCheck?.manualInput) {
    geometry = fromManualCheck(source.manualCheck, source.gasketFacing, pressureHint);
  } else if (source.designConfig) {
    geometry = fromDesignConfig(source.designConfig, source.gasketFacing, pressureHint);
  } else if (source.customResult) {
    geometry = fromResult(source.customResult, source.gasketFacing, 'custom');
  } else if (source.result) {
    geometry = fromResult(source.result, source.gasketFacing, 'standard');
  }

  if (!geometry) {
    throw new Error(
      'No active blind flange geometry is available. Calculate a flange or define a design configuration before exporting STEP.',
    );
  }

  assertValidBlindFlangeCadGeometry(geometry);
  return geometry;
};
