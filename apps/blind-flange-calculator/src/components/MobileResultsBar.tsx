import {FileDown} from 'lucide-react';

type Props = {
  selectedPn?: number;
  thicknessMm?: number;
  boltPass?: boolean | null;
  canExport: boolean;
};

/**
 * Mobile-only sticky strip so PN / thickness / export stay reachable below the fold.
 */
export default function MobileResultsBar({selectedPn, thicknessMm, boltPass, canExport}: Props) {
  if (selectedPn === undefined && thicknessMm === undefined) {
    return null;
  }

  const boltLabel = boltPass === null || boltPass === undefined ? null : boltPass ? 'Pass' : 'Fail';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-950/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0 font-numeric text-sm text-bf-caption">
          {selectedPn !== undefined ? <span className="font-semibold text-slate-50">PN {selectedPn}</span> : null}
          {thicknessMm !== undefined ? (
            <span className="text-bf-hint">
              {selectedPn !== undefined ? ' · ' : ''}
              {thicknessMm} mm
            </span>
          ) : null}
          {boltLabel ? (
            <span className={boltPass ? 'text-emerald-300' : 'text-amber-200'}> · {boltLabel}</span>
          ) : null}
        </div>
        <a
          href="#file-export"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
            canExport
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
              : 'border-slate-700 bg-slate-900 text-bf-hint'
          }`}
        >
          <FileDown size={15} aria-hidden="true" />
          Export
        </a>
      </div>
    </div>
  );
}
