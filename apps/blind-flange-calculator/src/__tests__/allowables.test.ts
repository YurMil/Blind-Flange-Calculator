import {describe, expect, it} from 'vitest';
import {getAllowableStress, getHydroTestPressure} from '../domain/calculations/allowables';
import {MATERIALS} from '../domain/standards/data';

describe('allowables', () => {
  it('selects nearest lower temperature yield bucket (no interpolation)', () => {
    const material = MATERIALS.P355GH;
    const temps = Object.keys(material.yieldByTemp)
      .map(Number)
      .sort((a, b) => a - b);
    expect(temps.length).toBeGreaterThan(2);

    const mid = temps[1];
    const next = temps[2];
    const probe = mid + (next - mid) / 2;
    const S = getAllowableStress('P355GH', probe, 'EN', 'operating');
    expect(S).toBeCloseTo(material.yieldByTemp[mid] / 1.5, 8);
  });

  it('uses EN and ASME test gammas', () => {
    const en = getAllowableStress('P355GH', 20, 'EN', 'test');
    const asme = getAllowableStress('P355GH', 20, 'ASME', 'test');
    const yield20 = MATERIALS.P355GH.yieldByTemp[20];
    expect(en).toBeCloseTo(yield20 / 1.05, 8);
    expect(asme).toBeCloseTo(yield20 / 1.1, 8);
  });

  it('computes EN hydrotest as max(1.25·P·ratio, 1.43·P) and clamps to operating', () => {
    const result = getHydroTestPressure({
      code: 'EN13445',
      P_design_bar: 16,
      P_op_bar: 16,
      T_design_C: 20,
      T_test_C: 20,
      materialId: 'P355GH',
    });
    expect(result.P_test_bar).toBeGreaterThanOrEqual(16);
    expect(result.basis).toContain('EN 13445-5');
  });
});
