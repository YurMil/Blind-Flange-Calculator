import {describe, expect, it} from 'vitest';
import {
  deriveFacingParameters,
  raisedFaceHeightForPressureClass,
} from '../cad/geometry/deriveFacingParameters';
import {mapFacingType} from '../cad/geometry/compute-flange-geometry';
import {validateBlindFlangeCadGeometry} from '../cad/geometry/validation';
import type {BlindFlangeCadGeometry} from '../cad/types/cad-types';

describe('raisedFaceHeightForPressureClass', () => {
  it('uses 1.6 mm for low PN and 6.4 mm for high PN', () => {
    expect(raisedFaceHeightForPressureClass(16)).toBe(1.6);
    expect(raisedFaceHeightForPressureClass(40)).toBe(1.6);
    expect(raisedFaceHeightForPressureClass(63)).toBe(6.4);
  });
});

describe('mapFacingType', () => {
  it('maps gasket facing options onto CAD facing types', () => {
    expect(mapFacingType('FF')).toBe('FF');
    expect(mapFacingType('RF')).toBe('RF');
    expect(mapFacingType('RTJ')).toBe('RTJ');
    expect(mapFacingType('IBC')).toBe('CUSTOM');
  });
});

describe('deriveFacingParameters', () => {
  const base = {
    outerDiameter: 340,
    boltCircleDiameter: 295,
    boltHoleDiameter: 22,
    gasketId: 200,
    gasketOd: 240,
    pressureClassHint: 16,
  };

  it('clears facing dims for FF', () => {
    const facing = deriveFacingParameters({...base, facingType: 'FF'});
    expect(facing.raisedFaceDiameter).toBeUndefined();
    expect(facing.rtjPitchDiameter).toBeUndefined();
  });

  it('derives RF diameter from gasket OD and height from PN hint', () => {
    const facing = deriveFacingParameters({...base, facingType: 'RF'});
    expect(facing.raisedFaceDiameter).toBe(240);
    expect(facing.raisedFaceHeight).toBe(1.6);
  });

  it('derives RTJ groove pitch/width/depth heuristics', () => {
    const facing = deriveFacingParameters({...base, facingType: 'RTJ', pressureClassHint: 100});
    expect(facing.rtjPitchDiameter).toBeGreaterThan(0);
    expect(facing.rtjGrooveWidth).toBeGreaterThan(0);
    expect(facing.rtjGrooveDepth).toBeGreaterThan(0);
    expect(facing.rtjPitchDiameter! + facing.rtjGrooveWidth!).toBeLessThan(base.boltCircleDiameter);
  });
});

describe('validateBlindFlangeCadGeometry facing rules', () => {
  const validBase = (): BlindFlangeCadGeometry => ({
    outerDiameter: 340,
    thickness: 24,
    boltCircleDiameter: 295,
    boltHoleCount: 8,
    boltHoleDiameter: 22,
    source: 'standard',
  });

  it('accepts RF geometry inside the bolt pattern', () => {
    const errors = validateBlindFlangeCadGeometry({
      ...validBase(),
      facingType: 'RF',
      raisedFaceDiameter: 240,
      raisedFaceHeight: 1.6,
    });
    expect(errors).toEqual([]);
  });

  it('rejects RF that intersects the bolt holes', () => {
    const errors = validateBlindFlangeCadGeometry({
      ...validBase(),
      facingType: 'RF',
      raisedFaceDiameter: 290,
      raisedFaceHeight: 2,
    });
    expect(errors.some((e) => e.includes('Raised face'))).toBe(true);
  });

  it('rejects RTJ groove deeper than thickness', () => {
    const errors = validateBlindFlangeCadGeometry({
      ...validBase(),
      facingType: 'RTJ',
      rtjPitchDiameter: 220,
      rtjGrooveWidth: 8,
      rtjGrooveDepth: 30,
    });
    expect(errors.some((e) => e.toLowerCase().includes('depth'))).toBe(true);
  });
});
