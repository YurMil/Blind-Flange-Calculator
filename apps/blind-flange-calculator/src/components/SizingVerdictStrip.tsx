import {AlertTriangle, CheckCircle2, Layers} from 'lucide-react';

type Props = {
  selectedPn?: number;
  recommendedThicknessMm: number;
  codeMinimumMm: number;
  boltPass: boolean | null;
  boltDetail?: string;
};

const formatFixed = (value: number, digits = 1) => value.toFixed(digits);

/**
 * Primary sizing answers at a glance: PN, stocked plate thickness, bolt check.
 */
export default function SizingVerdictStrip({
  selectedPn,
  recommendedThicknessMm,
  codeMinimumMm,
  boltPass,
  boltDetail,
}: Props) {
  const boltTone =
    boltPass === null
      ? 'border-slate-700 bg-slate-950/50 text-slate-200'
      : boltPass
        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-100';

  return (
    <section
      className="rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-4 shadow-lg shadow-slate-950/20 md:p-5"
      aria-label="Sizing verdict"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/90">Sizing verdict</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/45 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Selected PN</p>
          <p className="mt-1 text-3xl font-semibold text-slate-50">
            {selectedPn !== undefined ? `PN ${selectedPn}` : '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/45 p-3">
          <div className="flex items-start gap-2">
            <Layers size={16} className="mt-1 text-cyan-300" aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Recommended plate thickness</p>
              <p className="mt-1 text-3xl font-semibold text-slate-50">
                {formatFixed(recommendedThicknessMm, 0)}{' '}
                <span className="text-base font-normal text-slate-400">mm</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Code minimum {formatFixed(codeMinimumMm, 2)} mm (with CA, before stock rounding)
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-3 ${boltTone}`}>
          <div className="flex items-start gap-2">
            {boltPass === false ? (
              <AlertTriangle size={16} className="mt-1" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} className="mt-1" aria-hidden="true" />
            )}
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">Bolt check</p>
              <p className="mt-1 text-3xl font-semibold">
                {boltPass === null ? 'n/a' : boltPass ? 'Pass' : 'Fail'}
              </p>
              {boltDetail ? <p className="mt-1 text-xs opacity-80">{boltDetail}</p> : null}
              {boltPass === true ? (
                <p className="mt-1 text-xs opacity-80">Ready for PDF / DXF / STEP export</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
