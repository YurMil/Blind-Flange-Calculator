/**
 * Shared circular-plate physics helpers used by standard, custom, and manual paths.
 * Units: pressure MPa, length mm, stress MPa, modulus MPa.
 */

const DEFAULT_NU = 0.3;
const DEFAULT_MODULUS_MPA = 200_000;
const INVALID_RESULT = 999;

/** Max deflection at center (simply supported plate model). */
export const calcPlateDeflection = (
  pressureMPa: number,
  radiusMm: number,
  thicknessMm: number,
  modulusMPa: number = DEFAULT_MODULUS_MPA,
  nu: number = DEFAULT_NU,
): number => {
  if (thicknessMm <= 0 || radiusMm <= 0) return INVALID_RESULT;
  const D = (modulusMPa * Math.pow(thicknessMm, 3)) / (12 * (1 - Math.pow(nu, 2)));
  const num = (5 + nu) * pressureMPa * Math.pow(radiusMm, 4);
  const den = 64 * D * (1 + nu);
  return num / den;
};

/** Bending stress at center. */
export const calcPlateStress = (
  pressureMPa: number,
  radiusMm: number,
  thicknessMm: number,
  nu: number = DEFAULT_NU,
): number => {
  if (thicknessMm <= 0 || radiusMm <= 0) return INVALID_RESULT;
  return (3 * pressureMPa * Math.pow(radiusMm, 2) * (3 + nu)) / (8 * Math.pow(thicknessMm, 2));
};

/** Required thickness to limit bending stress (plasticity check). */
export const calcThickForStress = (
  pressureMPa: number,
  radiusMm: number,
  limitStressMPa: number,
  nu: number = DEFAULT_NU,
): number => {
  if (limitStressMPa <= 0 || radiusMm <= 0 || pressureMPa < 0) return 0;
  const res = Math.sqrt((3 * pressureMPa * Math.pow(radiusMm, 2) * (3 + nu)) / (8 * limitStressMPa));
  return Number.isNaN(res) ? 0 : res;
};

/** Required thickness to limit deflection (stiffness check). */
export const calcThickForDeflection = (
  pressureMPa: number,
  radiusMm: number,
  limitMm: number,
  modulusMPa: number = DEFAULT_MODULUS_MPA,
  nu: number = DEFAULT_NU,
): number => {
  if (limitMm <= 0 || radiusMm <= 0 || pressureMPa < 0) return 0;
  const num = (5 + nu) * pressureMPa * Math.pow(radiusMm, 4) * 12 * (1 - Math.pow(nu, 2));
  const den = 64 * modulusMPa * limitMm * (1 + nu);
  const res = Math.cbrt(num / den);
  return Number.isNaN(res) ? 0 : res;
};
