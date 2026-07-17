import {useEffect, useMemo} from 'react';
import {AlertTriangle, CheckCircle2, Target, Wrench} from 'lucide-react';
import {getBoltHoleDiameter} from '../domain/calculations/bolting';
import {getFastenerCatalogEntry, getFastenerEffectiveProps} from '../domain/standards/data';
import type {CalculationInput, DesignConfiguration} from '../domain/types/bfTypes';
import {runManualCheck} from '../domain/calculations/manualCheck';
import type {ManualCheckInput, ManualCheckResult} from '../domain/types/manualCheckTypes';
import CommittedNumberInput from './CommittedNumberInput';
import Field from './Field';
import ManualCheckCharts from './ManualCheckCharts';
import FlangeVisualizer from './FlangeVisualizer';

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-400';

const BOLT_SIZES = ['M16', 'M20', 'M24', 'M27', 'M30', 'M33', 'M36', 'M39', 'M42', 'M45', 'M48', 'M52', 'M56', 'M60', 'M64'];

const ResultCard = ({
  label,
  value,
  subtext,
  pass,
}: {
  label: string;
  value: string;
  subtext?: string;
  pass?: boolean;
}) => (
  <div
    className={`rounded-2xl border p-4 ${
      pass === undefined
        ? 'border-slate-800 bg-slate-900/70 text-slate-100'
        : pass
          ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
    }`}
  >
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-xl font-semibold">{value}</p>
    {subtext ? <p className="mt-1 text-xs text-slate-400">{subtext}</p> : null}
  </div>
);

type Props = {
  input: CalculationInput;
  targetPN: number;
  config: DesignConfiguration;
  isStandard?: boolean;
  onConfigChange: (value: DesignConfiguration, isUser?: boolean) => void;
  onManualResultChange?: (result: ManualCheckResult | null) => void;
};

export default function ManualCheckPanel({
  input,
  targetPN,
  config,
  isStandard,
  onConfigChange,
  onManualResultChange,
}: Props) {
  const fastenerGradeId = input.fastenerGradeId ?? 'EN_8.8';
  const fastenerEntry = getFastenerCatalogEntry(fastenerGradeId);
  const effectiveFastener = getFastenerEffectiveProps(fastenerGradeId, Number(config.boltSize.replace('M', '')));
  const gasketMean = (config.gasketId + config.gasketOd) / 2;

  const manualInput: ManualCheckInput = useMemo(
    () => ({
      boltCircle: config.boltCircle,
      boltCount: config.boltCount,
      boltHoleDiameter: config.boltHoleDiameter,
      outerDiameter: config.outerDiameter,
      thickness: config.thickness,
      boltSize: config.boltSize,
      corrosionAllowance: input.corrosionAllowance,
      fastenerStandard: input.fastenerStandard ?? 'EN',
      fastenerType: input.fastenerType ?? 'BOLT',
      fastenerGradeId: input.fastenerGradeId ?? 'EN_8.8',
      frictionPreset: input.frictionPreset,
      tighteningMethod: input.tighteningMethod ?? 'k_factor',
      gasketId: config.gasketId,
      gasketOd: config.gasketOd,
      gasketFacing: input.gasketFacing,
      gasketMaterial: input.gasketMaterial,
      gasketThickness: input.gasketThickness,
    }),
    [config, input],
  );

  const canRun =
    manualInput.boltCircle > 0 &&
    manualInput.boltCount > 1 &&
    manualInput.boltHoleDiameter > 0 &&
    manualInput.outerDiameter > 0 &&
    manualInput.thickness > 0 &&
    manualInput.boltSize.length > 0 &&
    (manualInput.gasketId ?? 0) > 0 &&
    (manualInput.gasketOd ?? 0) > 0;

  const result = useMemo(() => (canRun ? runManualCheck(input, manualInput, targetPN) : null), [canRun, input, manualInput, targetPN]);

  useEffect(() => {
    onManualResultChange?.(result);
  }, [result, onManualResultChange]);

  const updateConfig = (next: Partial<DesignConfiguration>) => {
    onConfigChange({...config, ...next}, true);
  };

  const thicknessMin = result?.thicknessSummary?.requiredWithCA ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Wrench size={14} />
              Manual / check
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Design configuration</h3>
            <p className="text-sm text-slate-400">Adjust bolt/gasket geometry and thickness, then review live checks.</p>
            {isStandard ? (
              <p className="mt-2 text-xs text-amber-200">
                Standard mode: editing these fields makes the solution non-standard.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Plate geometry</p>
            <Field id="mc-outer-diameter" label="Outer diameter D" hint="mm" className="space-y-1">
              <CommittedNumberInput
                id="mc-outer-diameter"
                className={inputClass}
                value={config.outerDiameter}
                onCommit={(value) => updateConfig({outerDiameter: value})}
                min={1}
              />
            </Field>
            <Field id="mc-thickness" label="Thickness (incl. CA)" hint="mm" className="space-y-1">
              <CommittedNumberInput
                id="mc-thickness"
                className={inputClass}
                value={config.thickness}
                onCommit={(value) => updateConfig({thickness: value})}
                min={thicknessMin > 0 ? thicknessMin : 1}
              />
              {thicknessMin > 0 ? (
                <p className="mt-1 text-[11px] text-slate-500">Minimum allowed: {thicknessMin.toFixed(2)} mm</p>
              ) : null}
            </Field>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Bolting configuration</p>
            <Field id="mc-bolt-circle" label="Bolt circle K" hint="mm" className="space-y-1">
              <CommittedNumberInput
                id="mc-bolt-circle"
                className={inputClass}
                value={config.boltCircle}
                onCommit={(value) => updateConfig({boltCircle: value})}
                min={1}
              />
            </Field>
            <Field id="mc-bolt-count" label="Bolt count" hint="qty" className="space-y-1">
              <CommittedNumberInput
                id="mc-bolt-count"
                className={inputClass}
                value={config.boltCount}
                onCommit={(value) => updateConfig({boltCount: value})}
                min={2}
                inputMode="numeric"
                normalize={Math.round}
              />
            </Field>
            <Field id="mc-bolt-size" label="Bolt size" className="space-y-1">
              <select
                id="mc-bolt-size"
                className={`${inputClass} appearance-none`}
                value={config.boltSize}
                onChange={(e) => {
                  const nextSize = e.target.value;
                  const nextHole = getBoltHoleDiameter(nextSize) || config.boltHoleDiameter;
                  updateConfig({boltSize: nextSize, boltHoleDiameter: nextHole});
                }}
              >
                {BOLT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="mc-bolt-hole-diameter" label="Bolt hole diameter d2" hint="mm" className="space-y-1">
              <CommittedNumberInput
                id="mc-bolt-hole-diameter"
                className={inputClass}
                value={config.boltHoleDiameter}
                onCommit={(value) => updateConfig({boltHoleDiameter: value})}
                min={1}
              />
            </Field>
            <p className="text-xs text-slate-500">
              Fastener: {fastenerEntry.label}. Proof/Yield:{' '}
              {effectiveFastener.proof > 1 ? `${effectiveFastener.proof}/${effectiveFastener.yield} MPa` : 'n/a'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Gasket configuration</p>
            <Field id="mc-gasket-id" label="Gasket ID" hint="mm" className="space-y-1">
              <CommittedNumberInput
                id="mc-gasket-id"
                className={inputClass}
                value={config.gasketId}
                onCommit={(value) => updateConfig({gasketId: value})}
                min={1}
              />
            </Field>
            <Field id="mc-gasket-od" label="Gasket OD" hint="mm" className="space-y-1">
              <CommittedNumberInput
                id="mc-gasket-od"
                className={inputClass}
                value={config.gasketOd}
                onCommit={(value) => updateConfig({gasketOd: value})}
                min={1}
              />
            </Field>
            <p className="text-xs text-slate-500">Mean diameter: {gasketMean.toFixed(1)} mm</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Process settings</p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
              {input.gasketFacing} / {input.gasketMaterial} / {input.gasketThickness} mm
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
              P_op {input.pressureOp} bar · P_test {input.pressureTest} bar · T {input.temperature} C
            </div>
          </div>
        </div>
      </div>

      {!canRun ? (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
          <Target size={16} className="text-slate-400" />
          <span>Fill in geometry to run verification.</span>
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-4 ${
              result.pass
                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {result.pass ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{result.pass ? 'Pass' : 'Check failed'}</span>
            </div>
            {result.errors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {result.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ResultCard
              label="Thickness utilization"
              value={
                result.thicknessSummary
                  ? `${result.thicknessSummary.provided.toFixed(1)} / ${result.thicknessSummary.requiredWithCA.toFixed(1)} mm`
                  : 'n/a'
              }
              subtext={
                result.thicknessSummary ? `Util ${Math.round(result.thicknessSummary.utilization * 100)}%` : undefined
              }
              pass={result.thicknessSummary?.pass}
            />
            <ResultCard
              label="Bolt utilization"
              value={
                result.boltSummary
                  ? `${Math.max(
                      result.boltSummary.areas.utilizationSeating,
                      result.boltSummary.areas.utilizationOper,
                      result.boltSummary.areas.utilizationHydro,
                    ).toFixed(2)} x`
                  : 'n/a'
              }
              subtext={result.boltSummary ? `Case: ${result.boltSummary.governingCase}` : undefined}
              pass={result.boltSummary?.pass}
            />
            <ResultCard
              label="Plasticity check"
              value={
                result.stressCheck
                  ? `${result.stressCheck.stressTestMPa.toFixed(1)} / ${result.stressCheck.yieldAtTestMPa.toFixed(0)} MPa`
                  : 'n/a'
              }
              subtext="Stress vs yield"
              pass={result.stressCheck?.pass}
            />
            <ResultCard
              label="Deflection check"
              value={
                result.deflectionCheck
                  ? `${result.deflectionCheck.deflectionOpMm.toFixed(2)} / ${result.deflectionCheck.limitMm.toFixed(1)} mm`
                  : 'n/a'
              }
              subtext="Operating"
              pass={result.deflectionCheck?.pass}
            />
          </div>

          <ManualCheckCharts boltSummary={result.boltSummary} thicknessSummary={result.thicknessSummary} />

          <FlangeVisualizer
            dn={input.dn}
            dims={{
              D: manualInput.outerDiameter,
              k: manualInput.boltCircle,
              bolts: manualInput.boltCount,
              size: manualInput.boltSize,
              d2: manualInput.boltHoleDiameter,
            }}
            selectedPN={targetPN}
            recommendedThickness={manualInput.thickness}
            gasketMeanDiameter={result.gasketSummary?.gasketMeanDiameter}
            gasketId={result.gasketSummary?.gasketId}
            gasketOd={result.gasketSummary?.gasketOd}
          />
        </div>
      ) : null}
    </div>
  );
}
