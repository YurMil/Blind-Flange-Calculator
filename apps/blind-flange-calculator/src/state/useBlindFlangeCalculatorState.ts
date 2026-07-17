import {useCallback, useEffect, useMemo, useState} from 'react';
import {AVAILABLE_DNS, DEFAULT_FASTENER_ID, MATERIALS, getFastenerOptionsFor} from '../data';
import {getHydroTestPressure} from '../allowables';
import type {CustomSizingResult} from '../custom';
import {
  createLiveHistoryEntryId,
  saveHistoryEntry,
  type ConfigurationHistorySummary,
} from '../history/configurationHistoryStore';
import {calculateBlindFlange, findClosestStandardFromDims, getCalculatedPN, getMaxAvailablePN} from '../utils';
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
} from '../bfTypes';
import type {ManualCheckResult} from '../manualCheckTypes';
import {
  MATERIAL_IDS,
  createDefaultFlangeTag,
  isRecord,
  optionalNumber,
  parseDesignConfig,
  requiredNumber,
  requiredString,
  resolveImportedDn,
  type BlindFlangeConfigurationFile,
} from './configurationFile';

export const MAX_STANDARD_PN = 400;

export function useBlindFlangeCalculatorState() {
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

  const handleGeometryModeChange = useCallback(
    (mode: GeometryMode) => {
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
    },
    [autoCustomDims, designConfig, dn, geometryMode, standardResult],
  );

  const selectedPn = result?.selectedPN;

  const handlePressureOpChange = useCallback((value: number) => {
    setPressureOp(value);
    setManualTestPressure(false);
  }, []);

  const handlePressureTestChange = useCallback(
    (value: number) => {
      setPressureTest(Math.max(value, pressureOp));
      setManualTestPressure(true);
    },
    [pressureOp],
  );

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

  const handleImportConfiguration = useCallback(
    (value: unknown) => {
      if (!isRecord(value) || value.schema !== 'blind-flange-calculator-config' || !isRecord(value.parameters)) {
        throw new Error('This is not a Blind Flange Calculator JSON configuration.');
      }

      const params = value.parameters;
      const nextDn = requiredNumber(params.dn, dn);
      setGeometryMode(requiredString(params.geometryMode, ['standard', 'custom'] as const, geometryMode));
      setDn(resolveImportedDn(nextDn, dn));
      setCustomOuterDiameter(optionalNumber(params.customOuterDiameter));
      setCustomNozzleId(optionalNumber(params.customNozzleId));
      setPressureOp(requiredNumber(params.pressureOp, pressureOp));
      setPressureTest(requiredNumber(params.pressureTest, pressureTest));
      setManualTestPressure(Boolean(params.manualTestPressure));
      setTemperature(requiredNumber(params.temperature, temperature));
      setMaterial(requiredString(params.material, MATERIAL_IDS, material));
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
      const importedTag =
        typeof value.tag === 'string' ? value.tag : typeof params.flangeTag === 'string' ? params.flangeTag : '';
      if (importedTag) {
        setFlangeTag(importedTag);
        setIsTagUserDefined(true);
      } else {
        setIsTagUserDefined(false);
      }
      setCustomResult(null);
      setManualCheckResult(null);
      setGeometryMatchNote(undefined);
    },
    [
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
    ],
  );

  const handleFlangeTagChange = useCallback((value: string) => {
    setFlangeTag(value);
    setIsTagUserDefined(true);
  }, []);

  const handleFlangeTagBlur = useCallback(() => {
    const trimmed = flangeTag.trim();
    if (trimmed) {
      setFlangeTag(trimmed);
      return;
    }

    setIsTagUserDefined(false);
    setFlangeTag(generatedFlangeTag);
  }, [flangeTag, generatedFlangeTag]);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const openHistory = useCallback(() => setIsHistoryOpen(true), []);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);

  return {
    dn,
    pressureOp,
    pressureTest,
    temperature,
    material,
    corrosionAllowance,
    gasketMaterial,
    gasketThickness,
    gasketFacing,
    geometryMode,
    customOuterDiameter,
    customNozzleId,
    designConfig,
    isUserDefined,
    geometryMatchNote,
    frictionPreset,
    tighteningMethod,
    fastenerStandard,
    fastenerType,
    fastenerGradeId,
    manualTestPressure,
    customResult,
    manualCheckResult,
    flangeTag,
    isTagUserDefined,
    isHistoryOpen,
    isHelpOpen,

    setDn,
    setCustomOuterDiameter,
    setCustomNozzleId,
    setTemperature,
    setMaterial,
    setCorrosionAllowance,
    setGasketMaterial,
    setGasketThickness,
    setGasketFacing,
    setFrictionPreset,
    setTighteningMethod,
    setFastenerStandard,
    setFastenerType,
    setFastenerGradeId,

    calculatedPn,
    maxAvailablePn,
    forceCustom,
    hydroAuto,
    hydroAutoRounded,
    isTestBelowAuto,
    generatedFlangeTag,
    input,
    result,
    exportResult,
    configurationFile,
    currentSummary,
    selectedPn,

    handleGeometryModeChange,
    handlePressureOpChange,
    handlePressureTestChange,
    handleCustomResultChange,
    handleManualResultChange,
    handleDesignConfigChange,
    handleImportConfiguration,
    handleFlangeTagChange,
    handleFlangeTagBlur,
    openHelp,
    closeHelp,
    openHistory,
    closeHistory,
  };
}
