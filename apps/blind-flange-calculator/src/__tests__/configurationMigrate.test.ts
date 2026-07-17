import {describe, expect, it} from 'vitest';
import {CURRENT_CONFIG_VERSION, migrateConfig} from '../state/configurationFile';

const validV1 = {
  schema: 'blind-flange-calculator-config',
  version: 1,
  savedAt: '2026-01-01T00:00:00.000Z',
  tag: 'BL-DN100-PN16-STD',
  parameters: {
    geometryMode: 'standard',
    dn: 100,
    customOuterDiameter: undefined,
    customNozzleId: undefined,
    pressureOp: 12,
    pressureTest: 18,
    manualTestPressure: false,
    temperature: 25,
    material: 'P355GH',
    corrosionAllowance: 2,
    gasketMaterial: 'ptfe',
    gasketThickness: 3,
    gasketFacing: 'FF',
    frictionPreset: 'lubricated',
    tighteningMethod: 'detailed',
    fastenerStandard: 'ASME',
    fastenerType: 'STUD',
    fastenerGradeId: 'ASME_SA193_B8_CL2',
    designConfig: null,
    isUserDefined: false,
  },
};

describe('migrateConfig', () => {
  it('accepts a valid v1 configuration and returns it at the current version', () => {
    const result = migrateConfig(validV1);

    expect(result.schema).toBe('blind-flange-calculator-config');
    expect(result.version).toBe(CURRENT_CONFIG_VERSION);
    expect(result.tag).toBe('BL-DN100-PN16-STD');
    expect(result.savedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.parameters).toMatchObject({
      geometryMode: 'standard',
      dn: 100,
      pressureOp: 12,
      pressureTest: 18,
      material: 'P355GH',
      gasketMaterial: 'ptfe',
      gasketFacing: 'FF',
      frictionPreset: 'lubricated',
      tighteningMethod: 'detailed',
      fastenerStandard: 'ASME',
      fastenerType: 'STUD',
      fastenerGradeId: 'ASME_SA193_B8_CL2',
      isUserDefined: false,
    });
    expect(result.parameters.designConfig).toBeNull();
  });

  it('defaults a missing version field to 1 and still migrates', () => {
    const noVersion = {
      schema: 'blind-flange-calculator-config',
      savedAt: '2026-01-02T00:00:00.000Z',
      tag: 'legacy-file',
      parameters: {
        dn: 200,
        pressureOp: 16,
      },
    };

    const result = migrateConfig(noVersion);

    expect(result.version).toBe(CURRENT_CONFIG_VERSION);
    expect(result.parameters.dn).toBe(200);
    expect(result.parameters.pressureOp).toBe(16);
    // Fields absent from the legacy file fall back to defaults instead of throwing.
    expect(result.parameters.geometryMode).toBe('standard');
    expect(result.parameters.material).toBe('P265GH');
    expect(result.parameters.fastenerGradeId).toBe('EN_8.8');
  });

  it('normalizes an out-of-range dn back to a valid EN 1092-1 size', () => {
    const badDn = {
      schema: 'blind-flange-calculator-config',
      version: 1,
      savedAt: '2026-01-03T00:00:00.000Z',
      tag: 'bad-dn',
      parameters: {dn: 999999},
    };

    const result = migrateConfig(badDn);
    expect(result.parameters.dn).toBe(100);
  });

  it('throws a clear error when schema does not match', () => {
    expect(() => migrateConfig({schema: 'something-else', parameters: {}})).toThrow(
      /not a Blind Flange Calculator/i,
    );
  });

  it('throws a clear error when parameters is missing or not a record', () => {
    expect(() => migrateConfig({schema: 'blind-flange-calculator-config'})).toThrow(/parameters/i);
    expect(() =>
      migrateConfig({schema: 'blind-flange-calculator-config', parameters: 'not-a-record'}),
    ).toThrow(/parameters/i);
  });

  it('throws for non-object input', () => {
    expect(() => migrateConfig(null)).toThrow();
    expect(() => migrateConfig('a string')).toThrow();
    expect(() => migrateConfig(42)).toThrow();
  });

  it('rejects configs saved by a newer, unsupported schema version', () => {
    expect(() =>
      migrateConfig({
        schema: 'blind-flange-calculator-config',
        version: CURRENT_CONFIG_VERSION + 1,
        parameters: {},
      }),
    ).toThrow(/newer app version/i);
  });
});
