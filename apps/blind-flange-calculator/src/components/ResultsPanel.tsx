import {useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {AlertTriangle, Bolt, CircleDot, Gauge, ShieldCheck, Weight} from 'lucide-react';
import CustomSizingPanel from './CustomSizingPanel';
import FlangeVisualizer from './FlangeVisualizer';
import ManualCheckPanel from './ManualCheckPanel';
import SizingVerdictStrip from './SizingVerdictStrip';
import {MATERIALS} from '../domain/standards/data';
import type {ResultsPanelProps} from '../domain/types/bfTypes';
import type {ResultCardProps} from '../uiTypes';
import {panelMotion} from '../motion';

const formatFixed = (value: number, digits = 1) => value.toFixed(digits);

const ResultCard = ({icon, label, value, unit, subtext, highlight, tone = 'secondary'}: ResultCardProps) => (
  <div
    className={`rounded-2xl border p-3 ${
      highlight
        ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
        : 'border-slate-800 bg-slate-900/55 text-slate-100'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${highlight ? 'text-cyan-300' : 'text-slate-500'}`}>{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-bf-caption">{label}</p>
        <p className={`mt-1 font-numeric font-semibold ${tone === 'primary' ? 'text-2xl' : 'text-xl'}`}>
          {value} {unit ? <span className="text-sm font-normal text-bf-hint">{unit}</span> : null}
        </p>
        {subtext ? <p className="mt-1 text-xs text-bf-hint">{subtext}</p> : null}
      </div>
    </div>
  </div>
);

export default function ResultsPanel({
  result,
  dn,
  pressureOp,
  targetPN,
  maxAvailablePN,
  input,
  designConfig,
  isUserDefined,
  onCustomResultChange,
  onManualResultChange,
  onDesignConfigChange,
}: ResultsPanelProps) {
  const boltFail = Boolean(result?.boltingSummary && !result.boltingSummary.pass);
  const boltFailReason = result?.boltingSummary?.failureReason;
  const fastenerPlaceholder = Boolean(result?.boltingSummary?.fastenerIsPlaceholder);
  const fastenerPlaceholderNote = result?.boltingSummary?.fastenerNotes ?? '';
  const thicknessUsed = result?.recommendedThickness ?? 0;
  const fallbackConfig = result
    ? {
        outerDiameter: result.dims.D,
        thickness: result.recommendedThickness,
        boltCircle: result.dims.k,
        boltCount: result.dims.bolts,
        boltSize: result.dims.size,
        boltHoleDiameter: result.dims.d2,
        gasketId: result.gasketId ?? dn,
        gasketOd: result.gasketOd ?? (result.gasketId ?? dn) + 20,
      }
    : null;
  const activeConfig = designConfig ?? fallbackConfig;
  const [viewMode, setViewMode] = useState<'auto' | 'manual'>('auto');
  const reduceMotion = useReducedMotion();
  const motionProps = panelMotion(reduceMotion);

  useEffect(() => {
    if (isUserDefined) {
      setViewMode('manual');
      return;
    }
    onManualResultChange?.(null);
    setViewMode('auto');
  }, [result?.dims?.D, input.geometryMode, isUserDefined, onManualResultChange]);

  const boltPass =
    result?.boltingSummary === undefined ? null : Boolean(result.boltingSummary.pass);
  const boltDetail =
    result?.boltingSummary === undefined
      ? undefined
      : result.boltingSummary.pass
        ? `${result.dims.bolts} × ${result.dims.size}`
        : fastenerPlaceholder
          ? 'Fastener data missing'
          : result.boltingSummary.governingCase
            ? `Governing: ${result.boltingSummary.governingCase}`
            : 'Insufficient bolt area';

  const verdict =
    result ? (
      <SizingVerdictStrip
        selectedPn={result.selectedPN}
        recommendedThicknessMm={thicknessUsed}
        codeMinimumMm={result.finalThickness}
        boltPass={boltPass}
        boltDetail={boltDetail}
      />
    ) : null;

  if (result && boltFail) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="bolt-fail"
          initial={motionProps.initial}
          animate={motionProps.animate}
          exit={motionProps.exit}
          transition={motionProps.transition}
          className="space-y-6"
        >
          {verdict}
          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-1 text-amber-300" />
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-200">Bolt check failed</p>
                <h3 className="mt-1 text-lg font-semibold">
                  {fastenerPlaceholder ? 'Fastener data missing' : 'Insufficient bolt area'}
                </h3>
                <p className="mt-2 text-sm text-amber-200">
                  {fastenerPlaceholder ? (
                    <>
                      Fastener data is missing for{' '}
                      <strong>{result.boltingSummary?.fastenerLabel ?? result.boltingSummary?.fastenerGradeId}</strong>.
                      {fastenerPlaceholderNote ? ` ${fastenerPlaceholderNote}` : ''}
                    </>
                  ) : (
                    <>
                      Governing case: <strong>{result.boltingSummary?.governingCase}</strong>.
                      {boltFailReason
                        ? ` Fail: ${boltFailReason.case}, A_req ${formatFixed(boltFailReason.requiredArea, 0)} mm² > A_provided ${formatFixed(
                            boltFailReason.providedArea,
                            0,
                          )} mm² (ΔA ${formatFixed(boltFailReason.deltaArea, 0)} mm²).`
                        : ' A_provided is below A_req for at least one of seating/operating/hydro.'}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div
          key="results"
          initial={motionProps.initial}
          animate={motionProps.animate}
          exit={motionProps.exit}
          transition={motionProps.transition}
          className="space-y-6"
        >
          {verdict}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Results view</div>
            <div
              className="inline-flex rounded-full border border-slate-800 bg-slate-950/60 p-1 text-xs"
              role="radiogroup"
              aria-label="Results view"
            >
              {(['auto', 'manual'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={viewMode === mode}
                  onClick={() => {
                    if (mode === 'auto' && fallbackConfig) {
                      onDesignConfigChange?.(fallbackConfig, false);
                      onManualResultChange?.(null);
                    }
                    setViewMode(mode);
                  }}
                  className={`rounded-full px-3 py-1 font-semibold transition ${
                    viewMode === mode ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-cyan-100'
                  }`}
                >
                  {mode === 'auto' ? 'Auto calculation' : 'Manual / Check mode'}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'manual' && activeConfig ? (
            <ManualCheckPanel
              input={input}
              targetPN={targetPN}
              config={activeConfig}
              isStandard={input.geometryMode === 'standard'}
              onConfigChange={(value, isUser) => {
                onDesignConfigChange?.(value, isUser);
                setViewMode('manual');
              }}
              onManualResultChange={onManualResultChange}
            />
          ) : null}
          {viewMode === 'manual' && !activeConfig ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
              Manual configuration is not available yet.
            </div>
          ) : null}

          {viewMode === 'auto' ? (
            <>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-bf-hint">Reference metrics</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <ResultCard
                    icon={<Weight size={18} />}
                    label="Flange weight"
                    value={formatFixed(
                      Math.PI *
                        Math.pow(result.dims.D / 2000, 2) *
                        (thicknessUsed / 1000) *
                        MATERIALS[input.material].density *
                        1000,
                      1,
                    )}
                    unit="kg"
                    subtext="Based on flange OD and recommended plate thickness"
                  />
                  <ResultCard
                    icon={<Bolt size={18} />}
                    label={`Bolt pattern (PN ${result.selectedPN})`}
                    value={result.dims.bolts.toString()}
                    unit="qty"
                    subtext={`Thread ${result.dims.size} · circle ${result.dims.k} mm`}
                  />
                  <ResultCard
                    icon={<CircleDot size={18} />}
                    label="Gasket mean dia"
                    value={formatFixed(result.gasketMeanDiameter, 0)}
                    unit="mm"
                    subtext="G_eff (EN 1514-1)"
                  />
                  <ResultCard
                    icon={<Gauge size={18} />}
                    label="Allowable stress (operating)"
                    value={formatFixed(result.allowableStressOp, 1)}
                    unit="MPa"
                    subtext="Material allowable at operating temperature"
                  />
                  <ResultCard
                    icon={<ShieldCheck size={18} />}
                    label="Allowable stress (test)"
                    value={formatFixed(result.allowableStressTest, 1)}
                    unit="MPa"
                    subtext="Material allowable for hydrotest"
                  />
                </div>
              </div>

              <FlangeVisualizer
                dn={dn}
                dims={result.dims}
                selectedPN={result.selectedPN}
                recommendedThickness={thicknessUsed}
                gasketMeanDiameter={result.gasketMeanDiameter}
                gasketId={result.gasketId}
                gasketOd={result.gasketOd}
              />

              <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6">
                <h3 className="text-lg font-semibold text-slate-100">Calculation details (EN 13445-3)</h3>
                <p className="mt-1 text-xs text-bf-hint">Reference breakdown — primary answers are in the sizing verdict above.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm text-slate-300">
                    <thead className="text-xs uppercase text-bf-hint">
                      <tr>
                        <th className="py-2 text-left">Parameter</th>
                        <th className="py-2 text-left">Value</th>
                        <th className="py-2 text-left">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 font-medium text-slate-200">Selected PN class</td>
                        <td className="py-2">PN {result.selectedPN}</td>
                        <td className="py-2 text-slate-400">
                          {input.geometryMode === 'custom'
                            ? 'Custom geometry mode'
                            : result.source === 'en1092'
                              ? `Nearest standard \u2265 ${pressureOp} bar`
                              : `Custom sizing for PN ${targetPN}`}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 font-medium text-slate-200">Code minimum (before CA)</td>
                        <td className="py-2">{formatFixed(result.minThickness, 2)} mm</td>
                        <td className="py-2 text-slate-400">Calculated plate requirement</td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 font-medium text-slate-200">Code minimum (with CA)</td>
                        <td className="py-2">{formatFixed(result.finalThickness, 2)} mm</td>
                        <td className="py-2 text-slate-400">Includes corrosion allowance</td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 font-medium text-slate-200">Recommended plate thickness</td>
                        <td className="py-2">{formatFixed(result.recommendedThickness, 0)} mm</td>
                        <td className="py-2 text-slate-400">Stocked plate after practical rounding</td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 font-medium text-slate-200">Bolt pattern</td>
                        <td className="py-2">
                          {result.dims.bolts} x {result.dims.size}
                        </td>
                        <td className="py-2 text-slate-400">Bolt circle {result.dims.k} mm</td>
                      </tr>
                      {result.boltingSummary ? (
                        <tr className="border-t border-slate-800">
                          <td className="py-2 font-medium text-slate-200">Fastener</td>
                          <td className="py-2">
                            {result.boltingSummary.fastenerStandard} / {result.boltingSummary.fastenerType}
                          </td>
                          <td className="py-2 text-slate-400">
                            {result.boltingSummary.fastenerLabel ?? result.boltingSummary.fastenerGradeId}
                            {result.boltingSummary.geometryAssumption
                              ? ` · ${result.boltingSummary.geometryAssumption}`
                              : ''}
                          </td>
                        </tr>
                      ) : null}
                      {result.boltTorque ? (
                        <tr className="border-t border-slate-800">
                          <td className="py-2 font-medium text-slate-200">Bolt torque</td>
                          <td className="py-2">
                            {formatFixed(result.boltTorque.torqueMinNm ?? result.boltTorque.torqueNm, 0)}–
                            {formatFixed(result.boltTorque.torqueMaxNm ?? result.boltTorque.torqueNm, 0)} N·m
                          </td>
                          <td className="py-2 text-slate-400">
                            {result.boltTorque.governingCaseUsed}, util{' '}
                            {formatFixed(result.boltTorque.preloadUtilization * 100, 0)}%
                            {result.boltTorque.cappedByProof ? ' (capped)' : ''}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      ) : (
        <motion.div
          key="custom-sizing"
          initial={reduceMotion ? false : {opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          exit={reduceMotion ? undefined : {opacity: 0}}
          transition={reduceMotion ? {duration: 0} : {duration: 0.2}}
        >
          <CustomSizingPanel
            input={input}
            targetPN={targetPN}
            maxAvailablePN={maxAvailablePN}
            onResultChange={onCustomResultChange}
            onManualResultChange={onManualResultChange}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
