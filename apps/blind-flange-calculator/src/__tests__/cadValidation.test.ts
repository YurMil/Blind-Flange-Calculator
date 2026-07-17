import {describe, expect, it} from 'vitest';
import {validateBlindFlangeCadGeometry} from '../cad/geometry/validation';
import type {BlindFlangeCadGeometry} from '../cad/types/cad-types';

const validGeometry = (): BlindFlangeCadGeometry => ({
  outerDiameter: 340,
  thickness: 24,
  boltCircleDiameter: 295,
  boltHoleCount: 8,
  boltHoleDiameter: 22,
  source: 'standard',
});

describe('validateBlindFlangeCadGeometry', () => {
  it('accepts a plausible flange geometry', () => {
    expect(validateBlindFlangeCadGeometry(validGeometry())).toEqual([]);
  });

  it('rejects bolt circle outside OD', () => {
    const errors = validateBlindFlangeCadGeometry({
      ...validGeometry(),
      boltCircleDiameter: 400,
    });
    expect(errors.some((e) => e.includes('Bolt circle'))).toBe(true);
  });

  it('rejects overlapping bolt holes', () => {
    const errors = validateBlindFlangeCadGeometry({
      ...validGeometry(),
      boltHoleCount: 100,
      boltHoleDiameter: 50,
    });
    expect(errors.some((e) => e.toLowerCase().includes('overlap'))).toBe(true);
  });

  it('rejects non-positive thickness', () => {
    const errors = validateBlindFlangeCadGeometry({
      ...validGeometry(),
      thickness: 0,
    });
    expect(errors.some((e) => e.includes('Thickness'))).toBe(true);
  });
});
