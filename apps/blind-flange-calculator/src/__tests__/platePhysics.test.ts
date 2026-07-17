import {describe, expect, it} from 'vitest';
import {
  calcPlateDeflection,
  calcPlateStress,
  calcThickForDeflection,
  calcThickForStress,
} from '../platePhysics';

describe('platePhysics', () => {
  const P = 1.6; // MPa
  const R = 125; // mm
  const t = 20; // mm
  const E = 200_000; // MPa
  const nu = 0.3;

  it('calcPlateStress matches closed-form formula', () => {
    const expected = (3 * P * R ** 2 * (3 + nu)) / (8 * t ** 2);
    expect(calcPlateStress(P, R, t)).toBeCloseTo(expected, 10);
  });

  it('calcPlateDeflection matches closed-form formula', () => {
    const D = (E * t ** 3) / (12 * (1 - nu ** 2));
    const expected = ((5 + nu) * P * R ** 4) / (64 * D * (1 + nu));
    expect(calcPlateDeflection(P, R, t, E)).toBeCloseTo(expected, 10);
  });

  it('calcThickForStress is the inverse of calcPlateStress', () => {
    const stress = calcPlateStress(P, R, t);
    const thickness = calcThickForStress(P, R, stress);
    expect(thickness).toBeCloseTo(t, 8);
  });

  it('calcThickForDeflection is the inverse of calcPlateDeflection', () => {
    const deflection = calcPlateDeflection(P, R, t, E);
    const thickness = calcThickForDeflection(P, R, deflection, E);
    expect(thickness).toBeCloseTo(t, 8);
  });

  it('returns guards for invalid geometry', () => {
    expect(calcPlateStress(P, R, 0)).toBe(999);
    expect(calcPlateDeflection(P, 0, t, E)).toBe(999);
    expect(calcThickForStress(P, R, 0)).toBe(0);
    expect(calcThickForDeflection(P, R, 0, E)).toBe(0);
  });
});
