import {Gauge} from 'lucide-react';

type Props = {
  pressureOp: number;
  calculatedPn: number;
  selectedPn?: number;
  forceCustom: boolean;
  maxStandardPn: number;
  maxAvailablePn?: number;
  dn: number;
};

export default function PnSelectionSummary({
  pressureOp,
  calculatedPn,
  selectedPn,
  forceCustom,
  maxStandardPn,
  maxAvailablePn,
  dn,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
      <div className="flex items-start gap-3">
        <div className="mt-1 text-cyan-300" aria-hidden="true">
          <Gauge size={18} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-bf-caption">PN selection</p>
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
              Operating pressure {pressureOp} bar exceeds standard PN {maxStandardPn}. Switching to custom sizing.
            </p>
          )}
          {maxAvailablePn !== undefined && maxAvailablePn < calculatedPn ? (
            <p className="mt-2 text-xs text-amber-200">
              This build only includes EN 1092-1 bolt patterns up to PN {maxAvailablePn} for DN {dn}. Add PN{' '}
              {calculatedPn} data to enable high-pressure sizing.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
