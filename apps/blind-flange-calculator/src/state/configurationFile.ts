import type {
  DesignConfiguration,
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  GeometryMode,
  MaterialId,
  TighteningMethod,
} from '../domain/types/bfTypes';
import {AVAILABLE_DNS, DEFAULT_FASTENER_ID, MATERIALS} from '../domain/standards/data';

export const CURRENT_CONFIG_VERSION = 1;

export type BlindFlangeConfigurationFile = {
  schema: 'blind-flange-calculator-config';
  version: 1;
  savedAt: string;
  tag: string;
  parameters: {
    geometryMode: GeometryMode;
    dn: number;
    customOuterDiameter?: number;
    customNozzleId?: number;
    pressureOp: number;
    pressureTest: number;
    manualTestPressure: boolean;
    temperature: number;
    material: MaterialId;
    corrosionAllowance: number;
    gasketMaterial: GasketMaterial;
    gasketThickness: number;
    gasketFacing: GasketFacing;
    frictionPreset: FrictionPreset;
    tighteningMethod: TighteningMethod;
    fastenerStandard: FastenerStandard;
    fastenerType: FastenerType;
    fastenerGradeId: FastenerGradeId;
    designConfig?: DesignConfiguration | null;
    isUserDefined: boolean;
    flangeTag?: string;
  };
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const optionalNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const requiredNumber = (value: unknown, fallback: number) => optionalNumber(value) ?? fallback;

export const requiredString = <TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  fallback: TValue,
) => (typeof value === 'string' && allowed.includes(value as TValue) ? (value as TValue) : fallback);

export const parseDesignConfig = (value: unknown): DesignConfiguration | null => {
  if (!isRecord(value)) return null;
  const boltSize = typeof value.boltSize === 'string' ? value.boltSize : 'M16';
  return {
    outerDiameter: requiredNumber(value.outerDiameter, 1),
    thickness: requiredNumber(value.thickness, 1),
    boltCircle: requiredNumber(value.boltCircle, 1),
    boltCount: requiredNumber(value.boltCount, 2),
    boltSize,
    boltHoleDiameter: requiredNumber(value.boltHoleDiameter, 1),
    gasketId: requiredNumber(value.gasketId, 1),
    gasketOd: requiredNumber(value.gasketOd, 1),
  };
};

export const createDefaultFlangeTag = (dn: number, pn: number, geometryMode: GeometryMode) =>
  `BL-DN${dn}-PN${pn}-${geometryMode === 'custom' ? 'CUSTOM' : 'STD'}`;

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

export const resolveImportedDn = (nextDn: number, fallback: number) =>
  AVAILABLE_DNS.includes(nextDn) ? nextDn : fallback;

const DEFAULT_PARAMETERS: BlindFlangeConfigurationFile['parameters'] = {
  geometryMode: 'standard',
  dn: 100,
  pressureOp: 10,
  pressureTest: 15,
  manualTestPressure: false,
  temperature: 20,
  material: 'P265GH',
  corrosionAllowance: 1,
  gasketMaterial: 'graphite',
  gasketThickness: 2,
  gasketFacing: 'RF',
  frictionPreset: 'dry',
  tighteningMethod: 'k_factor',
  fastenerStandard: 'EN',
  fastenerType: 'BOLT',
  fastenerGradeId: DEFAULT_FASTENER_ID,
  isUserDefined: false,
};

/**
 * Normalizes a raw (already schema/shape-checked) `parameters` record from a
 * v1 configuration file into the current `parameters` shape. Unknown/invalid
 * fields fall back to sane defaults instead of throwing, matching the
 * historically lenient import behavior.
 */
const migrateParametersV1 = (params: Record<string, unknown>): BlindFlangeConfigurationFile['parameters'] => ({
  geometryMode: requiredString(params.geometryMode, ['standard', 'custom'] as const, DEFAULT_PARAMETERS.geometryMode),
  dn: resolveImportedDn(requiredNumber(params.dn, DEFAULT_PARAMETERS.dn), DEFAULT_PARAMETERS.dn),
  customOuterDiameter: optionalNumber(params.customOuterDiameter),
  customNozzleId: optionalNumber(params.customNozzleId),
  pressureOp: requiredNumber(params.pressureOp, DEFAULT_PARAMETERS.pressureOp),
  pressureTest: requiredNumber(params.pressureTest, DEFAULT_PARAMETERS.pressureTest),
  manualTestPressure: Boolean(params.manualTestPressure),
  temperature: requiredNumber(params.temperature, DEFAULT_PARAMETERS.temperature),
  material: requiredString(params.material, MATERIAL_IDS, DEFAULT_PARAMETERS.material),
  corrosionAllowance: requiredNumber(params.corrosionAllowance, DEFAULT_PARAMETERS.corrosionAllowance),
  gasketMaterial: requiredString(
    params.gasketMaterial,
    ['graphite', 'tesnitBA50', 'ptfe'] as const,
    DEFAULT_PARAMETERS.gasketMaterial,
  ),
  gasketThickness: requiredNumber(params.gasketThickness, DEFAULT_PARAMETERS.gasketThickness),
  gasketFacing: requiredString(params.gasketFacing, ['RF', 'FF', 'IBC'] as const, DEFAULT_PARAMETERS.gasketFacing),
  frictionPreset: requiredString(params.frictionPreset, ['dry', 'lubricated'] as const, DEFAULT_PARAMETERS.frictionPreset),
  tighteningMethod: requiredString(
    params.tighteningMethod,
    ['k_factor', 'detailed'] as const,
    DEFAULT_PARAMETERS.tighteningMethod,
  ),
  fastenerStandard: requiredString(params.fastenerStandard, ['EN', 'ASME'] as const, DEFAULT_PARAMETERS.fastenerStandard),
  fastenerType: requiredString(params.fastenerType, ['BOLT', 'STUD'] as const, DEFAULT_PARAMETERS.fastenerType),
  fastenerGradeId: typeof params.fastenerGradeId === 'string' ? params.fastenerGradeId : DEFAULT_PARAMETERS.fastenerGradeId,
  designConfig: parseDesignConfig(params.designConfig),
  isUserDefined: Boolean(params.isUserDefined),
  flangeTag: typeof params.flangeTag === 'string' ? params.flangeTag : undefined,
});

/**
 * Version ladder for `BlindFlangeConfigurationFile`. Add one entry per
 * released schema version; each transformer takes the raw `parameters`
 * record from that version and returns the shape for the *next* version.
 * Keep old transformers even after `CURRENT_CONFIG_VERSION` moves on, so
 * files saved by older app builds keep importing correctly.
 */
const MIGRATIONS: Record<number, (params: Record<string, unknown>) => Record<string, unknown>> = {
  1: (params) => migrateParametersV1(params),
};

/**
 * Validates and migrates an arbitrary imported value (JSON config file or
 * IndexedDB history record) into a `BlindFlangeConfigurationFile` at
 * `CURRENT_CONFIG_VERSION`. Throws a descriptive `Error` for malformed input.
 */
export const migrateConfig = (value: unknown): BlindFlangeConfigurationFile => {
  if (!isRecord(value) || value.schema !== 'blind-flange-calculator-config') {
    throw new Error('This is not a Blind Flange Calculator JSON configuration.');
  }
  if (!isRecord(value.parameters)) {
    throw new Error('Blind Flange Calculator configuration is missing its "parameters" object.');
  }

  const rawVersion = value.version;
  const version = typeof rawVersion === 'number' && Number.isFinite(rawVersion) ? rawVersion : 1;

  if (version > CURRENT_CONFIG_VERSION) {
    throw new Error(
      `This configuration was saved by a newer app version (schema v${version}); this app supports up to v${CURRENT_CONFIG_VERSION}.`,
    );
  }

  let migratedParams: Record<string, unknown> = value.parameters;
  for (let step = Math.max(version, 1); step <= CURRENT_CONFIG_VERSION; step += 1) {
    const migrate = MIGRATIONS[step];
    if (!migrate) {
      throw new Error(`No migration registered for configuration schema v${step}.`);
    }
    migratedParams = migrate(migratedParams);
  }

  const parameters = migratedParams as BlindFlangeConfigurationFile['parameters'];
  const tag = typeof value.tag === 'string' ? value.tag : parameters.flangeTag ?? '';
  const savedAt = typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString();

  return {
    schema: 'blind-flange-calculator-config',
    version: CURRENT_CONFIG_VERSION,
    savedAt,
    tag,
    parameters,
  };
};
