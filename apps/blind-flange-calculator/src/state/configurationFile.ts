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
} from '../bfTypes';
import {AVAILABLE_DNS, MATERIALS} from '../data';

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
