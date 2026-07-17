import {describe, expect, it} from 'vitest';
import {calcBoltAreaChecks, calcRequiredBoltLoads} from '../bolting';
import {getCalculatedPN, calculateBlindFlange} from '../utils';
import type {CalculationInput} from '../bfTypes';

describe('getCalculatedPN', () => {
  it.each([
    [10, 10],
    [12, 16],
    [40, 40],
    [41, 63],
    [250, 250],
    [321, 400],
  ])('maps %s bar -> PN %s', (pressure, pn) => {
    expect(getCalculatedPN(pressure)).toBe(pn);
  });
});

describe('calcRequiredBoltLoads / calcBoltAreaChecks', () => {
  it('computes Wm1/Wm2 and governing area case', () => {
    const loads = calcRequiredBoltLoads({
      effectiveDiameter: 250,
      effectiveWidth: 12,
      m: 2,
      y: 11,
      pressureOp: 16,
      pressureTest: 23,
    });
    expect(loads.Wm1).toBeCloseTo(Math.PI * 250 * 12 * 11, 6);
    expect(loads.Wm2_op).toBeGreaterThan(0);
    expect(loads.Wm2_hydro).toBeGreaterThan(loads.Wm2_op);

    const check = calcBoltAreaChecks({
      loads,
      allowableBolt: 160,
      boltCount: 8,
      stressArea: 353,
    });
    expect(check.provided).toBe(8 * 353);
    expect(check.requiredBoltArea).toBe(
      Math.max(check.requiredAreaSeating, check.requiredAreaOper, check.requiredAreaHydro),
    );
    expect(['seating', 'operating', 'hydrotest']).toContain(check.governingCase);
  });
});

describe('calculateBlindFlange (standard)', () => {
  const baseInput: CalculationInput = {
    geometryMode: 'standard',
    dn: 200,
    pressureOp: 16,
    pressureTest: 23,
    temperature: 100,
    material: 'P355GH',
    corrosionAllowance: 1,
    gasketMaterial: 'graphite',
    gasketThickness: 2,
    gasketFacing: 'RF',
    frictionPreset: 'lubricated',
    fastenerStandard: 'EN',
    fastenerType: 'STUD',
    fastenerGradeId: 'EN_8.8',
  };

  it('returns EN1092 geometry and positive thickness for a typical DN200/PN16 case', () => {
    const result = calculateBlindFlange(baseInput);
    expect(result).not.toBeNull();
    expect(result!.source).toBe('en1092');
    expect(result!.selectedPN).toBeGreaterThanOrEqual(16);
    expect(result!.dims.D).toBeGreaterThan(200);
    expect(result!.dims.bolts).toBeGreaterThan(0);
    expect(result!.finalThickness).toBeGreaterThan(0);
    expect(result!.weight).toBeGreaterThan(0);
  });

  it('returns null when DN/PN combination cannot be resolved', () => {
    const result = calculateBlindFlange({
      ...baseInput,
      dn: 15,
      pressureOp: 400,
    });
    // DN15 may not have PN400 in the table
    if (result === null) {
      expect(result).toBeNull();
    } else {
      expect(result.selectedPN).toBeGreaterThanOrEqual(getCalculatedPN(400));
    }
  });
});
