import {useCallback, useEffect, useMemo, useState} from 'react';
import {Gauge, HelpCircle, History, Layers} from 'lucide-react';
import CalculationHelpDialog from './components/CalculationHelpDialog';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import ExportActions from './components/ExportActions';
import ConfigJsonActions from './components/ConfigJsonActions';
import ConfigurationHistoryPanel from './components/ConfigurationHistoryPanel';
import {AVAILABLE_DNS, DEFAULT_FASTENER_ID, MATERIALS, getFastenerOptionsFor} from './data';
import {getHydroTestPressure} from './allowables';
import type {CustomSizingResult} from './custom';
import {
  createLiveHistoryEntryId,
  saveHistoryEntry,
  type ConfigurationHistorySummary,
} from './history/configurationHistoryStore';
import {calculateBlindFlange, findClosestStandardFromDims, getCalculatedPN, getMaxAvailablePN} from './utils';
import type {
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  DesignConfiguration,
  GeometryMode,
  MaterialId,
  TighteningMethod,
} from './bfTypes';
import type {ManualCheckResult} from './manualCheckTypes';

const MAX_STANDARD_PN = 400;

const createDefaultFlangeTag = (dn: number, pn: number, geometryMode: GeometryMode) =>
  `BL-DN${dn}-PN${pn}-${geometryMode === 'custom' ? 'CUSTOM' : 'STD'}`;

type BlindFlangeConfigurationFile = {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const optionalNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

const requiredNumber = (value: unknown, fallback: number) => optionalNumber(value) ?? fallback;

const requiredString = <TValue extends string>(value: unknown, allowed: readonly TValue[], fallback: TValue) =>
  typeof value === 'string' && allowed.includes(value as TValue) ? (value as TValue) : fallback;

const parseDesignConfig = (value: unknown): DesignConfiguration | null => {
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

export default function BlindFlangeCalculator() {
  const [dn, setDn] = useState(100);
  const [pressureOp, setPressureOp] = useState(10);
  const [pressureTest, setPressureTest] = useState(15);
  const [temperature, setTemperature] = useState(20);
  const [material, setMaterial] = useState<MaterialId>('P265GH');
  const [corrosionAllowance, setCorrosionAllowance] = useState(1);
  const [gasketMaterial, setGasketMaterial] = useState<GasketMaterial>('graphite');
  const [gasketThickness, setGasketThickness] = useState(2);
  const [gasketFacing, setGasketFacing] = useState<GasketFacing>('RF');
  const [geometryMode, setGeometryMode] = useState<GeometryMode>('standard');
  const [customOuterDiameter, setCustomOuterDiameter] = useState<number | undefined>(undefined);
  const [customNozzleId, setCustomNozzleId] = useState<number | undefined>(undefined);
  const [designConfig, setDesignConfig] = useState<DesignConfiguration | null>(null);
  const [isUserDefined, setIsUserDefined] = useState(false);
  const [geometryMatchNote, setGeometryMatchNote] = useState<string | undefined>(undefined);
  const [frictionPreset, setFrictionPreset] = useState<FrictionPreset>('dry');
  const [tighteningMethod, setTighteningMethod] = useState<TighteningMethod>('k_factor');
  const [fastenerStandard, setFastenerStandard] = useState<FastenerStandard>('EN');
  const [fastenerType, setFastenerType] = useState<FastenerType>('BOLT');
  const [fastenerGradeId, setFastenerGradeId] = useState<FastenerGradeId>(DEFAULT_FASTENER_ID);
  const [manualTestPressure, setManualTestPressure] = useState(false);
  const [customResult, setCustomResult] = useState<CustomSizingResult | null>(null);
  const [manualCheckResult, setManualCheckResult] = useState<ManualCheckResult | null>(null);
  const [flangeTag, setFlangeTag] = useState(() => createDefaultFlangeTag(100, 10, 'standard'));
  const [isTagUserDefined, setIsTagUserDefined] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const calculatedPn = useMemo(() => getCalculatedPN(pressureOp), [pressureOp]);
  const maxAvailablePn = useMemo(() => getMaxAvailablePN(dn), [dn]);
  const exceedsPnCap = pressureOp > MAX_STANDARD_PN || pressureTest > MAX_STANDARD_PN;
  const forceCustom = geometryMode === 'custom' ? false : exceedsPnCap || (maxAvailablePn !== undefined && calculatedPn > maxAvailablePn);

  const hydroAuto = useMemo(
    () =>
      getHydroTestPressure({
        code: 'EN13445',
        P_design_bar: pressureOp,
        P_op_bar: pressureOp,
        T_design_C: temperature,
        T_test_C: 20,
        materialId: material,
      }),
    [pressureOp, temperature, material],
  );

  const hydroAutoRounded = Number.parseFloat(hydroAuto.P_test_bar.toFixed(1));
  const isTestBelowAuto = manualTestPressure && pressureTest < hydroAutoRounded;
  const generatedFlangeTag = useMemo(
    () => createDefaultFlangeTag(dn, calculatedPn, geometryMode),
    [dn, calculatedPn, geometryMode],
  );

  useEffect(() => {
    if (!isTagUserDefined) {
      setFlangeTag(generatedFlangeTag);
    }
  }, [generatedFlangeTag, isTagUserDefined]);

  useEffect(() => {
    const available = getFastenerOptionsFor(fastenerStandard, fastenerType);
    const hasCurrent = available.some((entry) => entry.id === fastenerGradeId);
    if (!hasCurrent && available.length > 0) {
      setFastenerGradeId(available[0].id);
    }
  }, [fastenerStandard, fastenerType, fastenerGradeId]);

  useEffect(() => {
    if (!manualTestPressure) {
      setPressureTest(Math.max(hydroAutoRounded, pressureOp));
    }
  }, [manualTestPressure, hydroAutoRounded, pressureOp]);

  useEffect(() => {
    if (geometryMode !== 'custom') return;
    if (!customNozzleId || customNozzleId <= 0) return;
    const nearestDn = AVAILABLE_DNS.reduce((closest, candidate) => {
      if (!closest) return candidate;
      return Math.abs(candidate - customNozzleId) < Math.abs(closest - customNozzleId)
        ? candidate
        : closest;
    }, 0);
    if (nearestDn && nearestDn !== dn) {
      setDn(nearestDn);
    }
  }, [geometryMode, customNozzleId, dn]);

  const input = useMemo(
    () => ({
      geometryMode,
      dn,
      customOuterDiameter,
      customNozzleId,
      pressureOp,
      pressureTest,
      temperature,
      material,
      corrosionAllowance,
      gasketMaterial,
      gasketThickness,
      gasketFacing,
      frictionPreset,
      tighteningMethod,
      fastenerStandard,
      fastenerType,
      fastenerGradeId,
    }),
    [
      geometryMode,
      dn,
      customOuterDiameter,
      customNozzleId,
      pressureOp,
      pressureTest,
      temperature,
      material,
      corrosionAllowance,
      gasketMaterial,
      gasketThickness,
      gasketFacing,
      frictionPreset,
      tighteningMethod,
      fastenerStandard,
      fastenerType,
      fastenerGradeId,
    ],
  );

  const standardResult = useMemo(() => calculateBlindFlange({...input, geometryMode: 'standard'}), [input]);
  const autoCustomDims = useMemo(() => {
    if (geometryMode !== 'custom') return null;
    if (!standardResult) return null;
    return {
      D: customOuterDiameter ?? standardResult.dims.D,
      k: standardResult.dims.k,
      bolts: standardResult.dims.bolts,
      size: standardResult.dims.size,
      d2: standardResult.dims.d2,
    };
  }, [geometryMode, standardResult, customOuterDiameter]);

  const calcInput = useMemo(() => {
    if (geometryMode !== 'custom' || !autoCustomDims) return input;
    return {
      ...input,
      customOuterDiameter: autoCustomDims.D,
      customBoltCircle: autoCustomDims.k,
      customBoltCount: autoCustomDims.bolts,
      customBoltSize: autoCustomDims.size,
      customBoltHoleDiameter: autoCustomDims.d2,
    };
  }, [geometryMode, autoCustomDims, input]);

  const result = useMemo(() => calculateBlindFlange(calcInput), [calcInput]);
  const exportResult = customResult?.result ?? result;
  const configurationFile = useMemo<BlindFlangeConfigurationFile>(
    () => ({
      schema: 'blind-flange-calculator-config',
      version: 1,
      savedAt: new Date().toISOString(),
      tag: flangeTag,
      parameters: {
        geometryMode,
        dn,
        customOuterDiameter,
        customNozzleId,
        pressureOp,
        pressureTest,
        manualTestPressure,
        temperature,
        material,
        corrosionAllowance,
        gasketMaterial,
        gasketThickness,
        gasketFacing,
        frictionPreset,
        tighteningMethod,
        fastenerStandard,
        fastenerType,
        fastenerGradeId,
        designConfig,
        isUserDefined,
      },
    }),
    [
      geometryMode,
      dn,
      customOuterDiameter,
      customNozzleId,
      pressureOp,
      pressureTest,
      manualTestPressure,
      temperature,
      material,
      corrosionAllowance,
      gasketMaterial,
      gasketThickness,
      gasketFacing,
      frictionPreset,
      tighteningMethod,
      fastenerStandard,
      fastenerType,
      fastenerGradeId,
      designConfig,
      isUserDefined,
      flangeTag,
    ],
  );
  const currentSummary = useMemo<ConfigurationHistorySummary>(() => {
    const geometry = designConfig
      ? {
          outerDiameter: designConfig.outerDiameter,
          thickness: designConfig.thickness,
          boltCircle: designConfig.boltCircle,
          boltCount: designConfig.boltCount,
          boltSize: designConfig.boltSize,
        }
      : exportResult
        ? {
            outerDiameter: exportResult.dims.D,
            thickness: exportResult.recommendedThickness,
            boltCircle: exportResult.dims.k,
            boltCount: exportResult.dims.bolts,
            boltSize: exportResult.dims.size,
          }
        : {};

    return {
      dn,
      pn: calculatedPn,
      geometryMode,
      pressureOp,
      pressureTest,
      material,
      ...geometry,
    };
  }, [calculatedPn, designConfig, dn, exportResult, geometryMode, material, pressureOp, pressureTest]);
  const isNonStandardConfiguration = Boolean(
    geometryMode === 'custom' ||
      forceCustom ||
      isUserDefined ||
      customResult ||
      manualCheckResult?.manualInput ||
      exportResult?.source === 'custom',
  );

  useEffect(() => {
    if (!isNonStandardConfiguration) return;

    const timeoutId = window.setTimeout(() => {
      const now = new Date().toISOString();
      const tag = flangeTag.trim() || generatedFlangeTag;
      void saveHistoryEntry({
        id: createLiveHistoryEntryId(tag),
        tag,
        savedAt: now,
        updatedAt: now,
        source: 'live',
        summary: currentSummary,
        config: {
          ...configurationFile,
          tag,
          savedAt: now,
        },
      });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [configurationFile, currentSummary, flangeTag, generatedFlangeTag, isNonStandardConfiguration]);

  useEffect(() => {
    if (result) {
      if (forceCustom) {
      } else {
        setCustomResult(null);
        setManualCheckResult(null);
      }
    }
  }, [result, forceCustom]);

  useEffect(() => {
    if (geometryMode !== 'custom') return;
    if (!standardResult) return;
    setCustomOuterDiameter((prev) => (prev && prev > 0 ? prev : standardResult.dims.D));
    setCustomNozzleId((prev) => (prev && prev > 0 ? prev : standardResult.gasketId ?? dn));
  }, [geometryMode, standardResult, dn]);

  useEffect(() => {
    if (!exportResult) return;
    if (isUserDefined) return;
    const gasketId = exportResult.gasketId ?? customNozzleId ?? dn;
    const gasketOd = exportResult.gasketOd ?? gasketId + 20;
    setDesignConfig({
      outerDiameter: exportResult.dims.D,
      thickness: exportResult.recommendedThickness,
      boltCircle: exportResult.dims.k,
      boltCount: exportResult.dims.bolts,
      boltSize: exportResult.dims.size,
      boltHoleDiameter: exportResult.dims.d2,
      gasketId,
      gasketOd,
    });
  }, [exportResult, isUserDefined, customNozzleId, dn]);

  const handleGeometryModeChange = (mode: GeometryMode) => {
    if (mode === geometryMode) return;
    setIsUserDefined(false);
    if (mode === 'custom') {
      if (standardResult) {
        setCustomOuterDiameter(standardResult.dims.D);
        setCustomNozzleId(standardResult.gasketId ?? dn);
      }
      setGeometryMatchNote(undefined);
      setGeometryMode('custom');
      return;
    }

    const customDims = designConfig
      ? {
          D: designConfig.outerDiameter,
          k: designConfig.boltCircle,
          bolts: designConfig.boltCount,
          size: designConfig.boltSize,
          d2: designConfig.boltHoleDiameter,
        }
      : autoCustomDims
        ? {
            D: autoCustomDims.D,
            k: autoCustomDims.k,
            bolts: autoCustomDims.bolts,
            size: autoCustomDims.size,
            d2: autoCustomDims.d2,
          }
        : null;
    if (customDims) {
      const match = findClosestStandardFromDims(customDims);
      if (match) {
        setDn(match.dn);
        setGeometryMatchNote(
          match.exact
            ? undefined
            : `No exact match found. Using nearest DN ${match.dn} / PN ${match.pn} (D=${match.dims.D} mm, K=${match.dims.k} mm).`,
        );
      } else {
        setGeometryMatchNote('No close EN 1092-1 match found. Standard mode reset to current DN.');
      }
    }
    setGeometryMode('standard');
  };

  const selectedPn = result?.selectedPN;

  const handleCustomResultChange = useCallback((value: CustomSizingResult | null) => {
    setCustomResult(value);
    setManualCheckResult(null);
  }, []);

  const handleManualResultChange = useCallback((value: ManualCheckResult | null) => {
    setManualCheckResult(value);
    setCustomResult(null);
  }, []);

  const handleDesignConfigChange = useCallback((value: DesignConfiguration, isUser?: boolean) => {
    setDesignConfig(value);
    if (isUser === false) {
      setIsUserDefined(false);
      return;
    }
    if (isUser) setIsUserDefined(true);
  }, []);

  const handleImportConfiguration = useCallback((value: unknown) => {
    if (!isRecord(value) || value.schema !== 'blind-flange-calculator-config' || !isRecord(value.parameters)) {
      throw new Error('This is not a Blind Flange Calculator JSON configuration.');
    }

    const params = value.parameters;
    const nextDn = requiredNumber(params.dn, dn);
    setGeometryMode(requiredString(params.geometryMode, ['standard', 'custom'] as const, geometryMode));
    setDn(AVAILABLE_DNS.includes(nextDn) ? nextDn : dn);
    setCustomOuterDiameter(optionalNumber(params.customOuterDiameter));
    setCustomNozzleId(optionalNumber(params.customNozzleId));
    setPressureOp(requiredNumber(params.pressureOp, pressureOp));
    setPressureTest(requiredNumber(params.pressureTest, pressureTest));
    setManualTestPressure(Boolean(params.manualTestPressure));
    setTemperature(requiredNumber(params.temperature, temperature));
    setMaterial(requiredString(params.material, Object.keys(MATERIALS) as MaterialId[], material));
    setCorrosionAllowance(requiredNumber(params.corrosionAllowance, corrosionAllowance));
    setGasketMaterial(requiredString(params.gasketMaterial, ['graphite', 'tesnitBA50', 'ptfe'] as const, gasketMaterial));
    setGasketThickness(requiredNumber(params.gasketThickness, gasketThickness));
    setGasketFacing(requiredString(params.gasketFacing, ['RF', 'FF', 'IBC'] as const, gasketFacing));
    setFrictionPreset(requiredString(params.frictionPreset, ['dry', 'lubricated'] as const, frictionPreset));
    setTighteningMethod(requiredString(params.tighteningMethod, ['k_factor', 'detailed'] as const, tighteningMethod));
    setFastenerStandard(requiredString(params.fastenerStandard, ['EN', 'ASME'] as const, fastenerStandard));
    setFastenerType(requiredString(params.fastenerType, ['BOLT', 'STUD'] as const, fastenerType));
    if (typeof params.fastenerGradeId === 'string') {
      setFastenerGradeId(params.fastenerGradeId);
    }
    setDesignConfig(parseDesignConfig(params.designConfig));
    setIsUserDefined(Boolean(params.isUserDefined));
    const importedTag = typeof value.tag === 'string' ? value.tag : typeof params.flangeTag === 'string' ? params.flangeTag : '';
    if (importedTag) {
      setFlangeTag(importedTag);
      setIsTagUserDefined(true);
    } else {
      setIsTagUserDefined(false);
    }
    setCustomResult(null);
    setManualCheckResult(null);
    setGeometryMatchNote(undefined);
  }, [
    corrosionAllowance,
    dn,
    fastenerStandard,
    fastenerType,
    frictionPreset,
    gasketFacing,
    gasketMaterial,
    gasketThickness,
    geometryMode,
    material,
    pressureOp,
    pressureTest,
    temperature,
    tighteningMethod,
  ]);

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Layers size={14} />
              EN 13445-3 / EN 1092-1
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Blind Flange Calculator</h1>
              <p className="text-sm text-slate-400">
                Automatic PN selection and thickness sizing with a quick weight estimate.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <label className="w-full max-w-sm space-y-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">Flange tag</span>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                value={flangeTag}
                onChange={(event) => {
                  setFlangeTag(event.target.value);
                  setIsTagUserDefined(true);
                }}
                onBlur={() => {
                  const trimmed = flangeTag.trim();
                  if (trimmed) {
                    setFlangeTag(trimmed);
                    return;
                  }

                  setIsTagUserDefined(false);
                  setFlangeTag(generatedFlangeTag);
                }}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
                aria-label="Open calculation help"
              >
                <HelpCircle size={17} />
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
              >
                <History size={16} />
                <span>History</span>
              </button>
              <ConfigJsonActions
                config={configurationFile}
                fileName={`${flangeTag}.json`}
                onImport={handleImportConfiguration}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <InputForm
              geometryMode={geometryMode}
              dn={dn}
              customOuterDiameter={customOuterDiameter}
              customNozzleId={customNozzleId}
              pressureOp={pressureOp}
              pressureTest={pressureTest}
              temperature={temperature}
              material={material}
              corrosionAllowance={corrosionAllowance}
              gasketMaterial={gasketMaterial}
              gasketThickness={gasketThickness}
              gasketFacing={gasketFacing}
              frictionPreset={frictionPreset}
              tighteningMethod={tighteningMethod}
              fastenerStandard={fastenerStandard}
              fastenerType={fastenerType}
              fastenerGradeId={fastenerGradeId}
              autoTestPressure={hydroAutoRounded}
              autoTestBasis={hydroAuto.basis}
              autoTestRatio={hydroAuto.ratioUsed}
              autoTestClampedToOp={hydroAuto.clampedToOp}
              showTestPressureWarning={isTestBelowAuto}
              availableDns={AVAILABLE_DNS}
              materials={MATERIALS}
              geometryMatchNote={geometryMatchNote}
              onGeometryModeChange={handleGeometryModeChange}
              onDnChange={setDn}
              onCustomOuterDiameterChange={setCustomOuterDiameter}
              onCustomNozzleIdChange={setCustomNozzleId}
              onPressureOpChange={(value) => {
                setPressureOp(value);
                setManualTestPressure(false);
              }}
              onPressureTestChange={(value) => {
                setPressureTest(Math.max(value, pressureOp));
                setManualTestPressure(true);
              }}
              onTemperatureChange={setTemperature}
              onMaterialChange={setMaterial}
              onCorrosionAllowanceChange={setCorrosionAllowance}
              onGasketMaterialChange={setGasketMaterial}
              onGasketThicknessChange={setGasketThickness}
              onGasketFacingChange={setGasketFacing}
              onFrictionPresetChange={setFrictionPreset}
              onTighteningMethodChange={setTighteningMethod}
              onFastenerStandardChange={setFastenerStandard}
              onFastenerTypeChange={setFastenerType}
              onFastenerGradeChange={setFastenerGradeId}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-cyan-300">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">PN selection</p>
                  {!forceCustom ? (
                    <p className="mt-1">
                      Operating pressure {pressureOp} bar maps to PN {calculatedPn}. Selected class:
                      <span className="ml-1 font-semibold text-slate-100">
                        {selectedPn ? `PN ${selectedPn}` : 'No match'}
                      </span>
                      .
                    </p>
                  ) : (
                    <p className="mt-1 text-amber-200">
                      Operating pressure {pressureOp} bar exceeds standard PN {MAX_STANDARD_PN}. Switching to custom sizing.
                    </p>
                  )}
                  {maxAvailablePn && maxAvailablePn < calculatedPn ? (
                    <p className="mt-2 text-xs text-amber-200">
                      This build only includes EN 1092-1 bolt patterns up to PN {maxAvailablePn} for DN {dn}. Add PN{' '}
                      {calculatedPn} data to enable high-pressure sizing.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ResultsPanel
              result={forceCustom ? null : result}
              customResult={customResult}
              manualCheckResult={manualCheckResult}
              designConfig={designConfig}
              isUserDefined={isUserDefined}
              dn={dn}
              pressureOp={pressureOp}
              targetPN={calculatedPn}
              maxAvailablePN={maxAvailablePn}
              input={input}
              onCustomResultChange={handleCustomResultChange}
              onManualResultChange={handleManualResultChange}
              onDesignConfigChange={handleDesignConfigChange}
            />
          </div>
        </div>
        <ExportActions
          input={input}
          result={exportResult}
          stepBaseResult={result}
          stepCustomResult={customResult?.result ?? null}
          designConfig={designConfig}
          gasketFacing={gasketFacing}
          manualCheckResult={manualCheckResult}
          targetPN={calculatedPn}
          customDebug={customResult?.debug}
        />
        <ConfigurationHistoryPanel
          open={isHistoryOpen}
          currentTag={flangeTag}
          currentConfig={configurationFile}
          currentSummary={currentSummary}
          onClose={() => setIsHistoryOpen(false)}
          onOpenConfig={handleImportConfiguration}
        />
        <CalculationHelpDialog open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    </div>
  );
}
