import type {BlindFlangeCadGeometry} from '../types/cad-types';

const EPSILON = 1e-6;

export const validateBlindFlangeCadGeometry = (geometry: BlindFlangeCadGeometry): string[] => {
  const errors: string[] = [];

  if (!Number.isFinite(geometry.outerDiameter) || geometry.outerDiameter <= 0) {
    errors.push('Outer diameter must be greater than 0.');
  }

  if (!Number.isFinite(geometry.thickness) || geometry.thickness <= 0) {
    errors.push('Thickness must be greater than 0.');
  }

  if (!Number.isFinite(geometry.boltCircleDiameter) || geometry.boltCircleDiameter <= 0) {
    errors.push('Bolt circle diameter must be greater than 0.');
  }

  if (!Number.isFinite(geometry.boltHoleCount) || geometry.boltHoleCount < 1) {
    errors.push('Bolt hole count must be at least 1.');
  }

  if (!Number.isInteger(geometry.boltHoleCount)) {
    errors.push('Bolt hole count must be a whole number.');
  }

  if (!Number.isFinite(geometry.boltHoleDiameter) || geometry.boltHoleDiameter <= 0) {
    errors.push('Bolt hole diameter must be greater than 0.');
  }

  if (geometry.boltCircleDiameter >= geometry.outerDiameter) {
    errors.push('Bolt circle diameter must stay inside the flange outer diameter.');
  }

  if (geometry.boltHoleDiameter >= geometry.boltCircleDiameter) {
    errors.push('Bolt hole diameter must be smaller than the bolt circle diameter.');
  }

  const outerRadius = geometry.outerDiameter / 2;
  const boltCircleRadius = geometry.boltCircleDiameter / 2;
  const holeRadius = geometry.boltHoleDiameter / 2;

  if (boltCircleRadius + holeRadius >= outerRadius - EPSILON) {
    errors.push('Bolt holes break through the flange outer edge.');
  }

  if (geometry.boltHoleCount > 1) {
    const chord = 2 * boltCircleRadius * Math.sin(Math.PI / geometry.boltHoleCount);
    if (chord <= geometry.boltHoleDiameter + EPSILON) {
      errors.push('Bolt holes overlap each other on the selected bolt circle.');
    }
  }

  const facingType = geometry.facingType ?? 'FF';

  if (facingType === 'RF') {
    const rfDiameter = geometry.raisedFaceDiameter ?? 0;
    const rfHeight = geometry.raisedFaceHeight ?? 0;
    if (rfDiameter <= 0) {
      errors.push('Raised face diameter must be greater than 0 for RF facing.');
    }
    if (rfHeight <= 0) {
      errors.push('Raised face height must be greater than 0 for RF facing.');
    }
    if (rfDiameter >= geometry.boltCircleDiameter - geometry.boltHoleDiameter) {
      errors.push('Raised face diameter must stay inside the bolt hole pattern.');
    }
    if (rfDiameter >= geometry.outerDiameter) {
      errors.push('Raised face diameter must be smaller than the flange outer diameter.');
    }
  }

  if (facingType === 'RTJ') {
    const pitch = geometry.rtjPitchDiameter ?? 0;
    const width = geometry.rtjGrooveWidth ?? 0;
    const depth = geometry.rtjGrooveDepth ?? 0;
    if (pitch <= 0 || width <= 0 || depth <= 0) {
      errors.push('RTJ groove pitch, width, and depth must all be greater than 0.');
    } else {
      const outerGroove = pitch / 2 + width / 2;
      const innerGroove = pitch / 2 - width / 2;
      if (innerGroove <= 0) {
        errors.push('RTJ groove inner radius must stay positive.');
      }
      if (outerGroove * 2 >= geometry.boltCircleDiameter - geometry.boltHoleDiameter) {
        errors.push('RTJ groove must stay inside the bolt hole pattern.');
      }
      if (depth >= geometry.thickness) {
        errors.push('RTJ groove depth must be smaller than the flange thickness.');
      }
    }
  }

  return errors;
};

export const assertValidBlindFlangeCadGeometry = (geometry: BlindFlangeCadGeometry) => {
  const errors = validateBlindFlangeCadGeometry(geometry);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
};
