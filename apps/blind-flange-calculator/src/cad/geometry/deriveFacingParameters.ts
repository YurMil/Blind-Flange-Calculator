import type {BlindFlangeCadGeometry, BlindFlangeFacingType} from '../types/cad-types';

/** Screening RF height (mm): ASME-like low vs high class split mapped onto EN PN. */
export const raisedFaceHeightForPressureClass = (pressureClassHint?: number): number => {
  if (pressureClassHint !== undefined && pressureClassHint > 40) {
    return 6.4;
  }
  return 1.6;
};

export type FacingDerivationInput = {
  facingType?: BlindFlangeFacingType;
  outerDiameter: number;
  boltCircleDiameter: number;
  boltHoleDiameter: number;
  gasketId?: number;
  gasketOd?: number;
  pressureClassHint?: number;
  raisedFaceHeight?: number;
  raisedFaceDiameter?: number;
  rtjPitchDiameter?: number;
  rtjGrooveWidth?: number;
  rtjGrooveDepth?: number;
};

/**
 * Derive RF / RTJ parameters for STEP facing features.
 * Values are screening heuristics for CAD export, not a certified facing table.
 */
export const deriveFacingParameters = (
  input: FacingDerivationInput,
): Pick<
  BlindFlangeCadGeometry,
  | 'facingType'
  | 'raisedFaceHeight'
  | 'raisedFaceDiameter'
  | 'rtjPitchDiameter'
  | 'rtjGrooveWidth'
  | 'rtjGrooveDepth'
  | 'pressureClassHint'
> => {
  const facingType = input.facingType ?? 'FF';
  const pressureClassHint = input.pressureClassHint;

  if (facingType === 'FF' || facingType === 'CUSTOM') {
    return {
      facingType,
      pressureClassHint,
      raisedFaceHeight: undefined,
      raisedFaceDiameter: undefined,
      rtjPitchDiameter: undefined,
      rtjGrooveWidth: undefined,
      rtjGrooveDepth: undefined,
    };
  }

  const boltCircle = input.boltCircleDiameter;
  const holeRadius = input.boltHoleDiameter / 2;
  const maxFaceDiameter = Math.max(1, boltCircle - 2 * holeRadius - 4);

  if (facingType === 'RF') {
    const preferred =
      input.raisedFaceDiameter && input.raisedFaceDiameter > 0
        ? input.raisedFaceDiameter
        : input.gasketOd && input.gasketOd > 0
          ? input.gasketOd
          : input.gasketId && input.gasketId > 0
            ? input.gasketId + Math.min(30, Math.max(20, input.outerDiameter * 0.02))
            : boltCircle * 0.72;

    const raisedFaceDiameter = Math.min(maxFaceDiameter, Math.max(preferred, (input.gasketId ?? preferred * 0.7)));
    const raisedFaceHeight =
      input.raisedFaceHeight && input.raisedFaceHeight > 0
        ? input.raisedFaceHeight
        : raisedFaceHeightForPressureClass(pressureClassHint);

    return {
      facingType,
      pressureClassHint,
      raisedFaceHeight,
      raisedFaceDiameter,
      rtjPitchDiameter: undefined,
      rtjGrooveWidth: undefined,
      rtjGrooveDepth: undefined,
    };
  }

  // RTJ — rectangular-section annular groove approximation
  const gasketMean =
    input.gasketId && input.gasketOd && input.gasketOd > input.gasketId
      ? (input.gasketId + input.gasketOd) / 2
      : boltCircle * 0.7;

  const rtjPitchDiameter =
    input.rtjPitchDiameter && input.rtjPitchDiameter > 0
      ? input.rtjPitchDiameter
      : Math.min(maxFaceDiameter - 8, Math.max(gasketMean, boltCircle * 0.55));

  const gasketWidth =
    input.gasketId && input.gasketOd && input.gasketOd > input.gasketId
      ? (input.gasketOd - input.gasketId) / 2
      : 10;

  const rtjGrooveWidth =
    input.rtjGrooveWidth && input.rtjGrooveWidth > 0
      ? input.rtjGrooveWidth
      : Math.min(16, Math.max(6.35, gasketWidth * 0.55));

  const rtjGrooveDepth =
    input.rtjGrooveDepth && input.rtjGrooveDepth > 0
      ? input.rtjGrooveDepth
      : Math.min(11, Math.max(4.5, raisedFaceHeightForPressureClass(pressureClassHint) + 3));

  return {
    facingType,
    pressureClassHint,
    raisedFaceHeight: undefined,
    raisedFaceDiameter: undefined,
    rtjPitchDiameter,
    rtjGrooveWidth,
    rtjGrooveDepth,
  };
};
