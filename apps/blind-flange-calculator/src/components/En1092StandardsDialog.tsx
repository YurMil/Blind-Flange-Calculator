import {useEffect, useMemo, useState} from 'react';
import {Table2, X} from 'lucide-react';
import {listEn1092PnClasses, listEn1092RowsForPn, type En1092CatalogRow} from '../domain/standards/en1092Catalog';

type Props = {
  open: boolean;
  onClose: () => void;
  currentDn?: number;
  currentPn?: number;
  onSelect: (selection: {dn: number; pn: number}) => void;
};

export default function En1092StandardsDialog({open, onClose, currentDn, currentPn, onSelect}: Props) {
  const pnClasses = useMemo(() => listEn1092PnClasses(), []);
  const [activePn, setActivePn] = useState<number>(pnClasses[0] ?? 16);

  useEffect(() => {
    if (!open) return;
    if (currentPn !== undefined && pnClasses.includes(currentPn)) {
      setActivePn(currentPn);
      return;
    }
    setActivePn(pnClasses[0] ?? 16);
  }, [open, currentPn, pnClasses]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const rows = useMemo(() => listEn1092RowsForPn(activePn), [activePn]);

  if (!open) return null;

  const handleSelect = (row: En1092CatalogRow) => {
    onSelect({dn: row.dn, pn: row.pn});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950"
        role="dialog"
        aria-modal="true"
        aria-labelledby="en1092-standards-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Table2 size={14} />
              EN 1092-1 · Type 05
            </div>
            <h2 id="en1092-standards-title" className="mt-3 text-2xl font-semibold text-slate-100">
              Blind flange dimensions
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-bf-caption">
              Interactive tables from the embedded EN 1092-1 Type 05 (blind) subset used by this calculator.
              Click any DN row to load that standard geometry into the configurator (DN + PN class).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            aria-label="Close EN 1092-1 tables"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-800 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bf-hint">PN class</p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="EN 1092-1 PN classes">
            {pnClasses.map((pn) => {
              const selected = pn === activePn;
              return (
                <button
                  key={pn}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActivePn(pn)}
                  className={`rounded-xl border px-3 py-1.5 font-numeric text-sm font-semibold transition ${
                    selected
                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100'
                      : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-100'
                  }`}
                >
                  PN {pn}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">PN {activePn}</h3>
              <p className="text-xs text-bf-hint">
                Columns match the usual EN 1092-1 blind-flange sheet: DN, D, K, bolt hole, count, bolt size.
                Plate thickness C is sized by the calculator (not listed in this embedded bolt-pattern table).
              </p>
            </div>
            <p className="text-xs text-bf-hint">{rows.length} DN sizes</p>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-bf-caption">
              No DN rows are available for PN {activePn} in this build.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-wide text-bf-hint">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">DN</th>
                    <th className="px-3 py-2.5 font-semibold">Outside D</th>
                    <th className="px-3 py-2.5 font-semibold">Bolt circle K</th>
                    <th className="px-3 py-2.5 font-semibold">Hole d2</th>
                    <th className="px-3 py-2.5 font-semibold">Bolts</th>
                    <th className="px-3 py-2.5 font-semibold">Bolt size</th>
                    <th className="px-3 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isCurrent = currentDn === row.dn && currentPn === row.pn;
                    return (
                      <tr
                        key={`${row.pn}-${row.dn}`}
                        className={`cursor-pointer border-t border-slate-800 transition ${
                          isCurrent
                            ? 'bg-cyan-500/15 text-cyan-50'
                            : 'bg-slate-950/40 text-slate-200 hover:bg-slate-800/80'
                        }`}
                        onClick={() => handleSelect(row)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelect(row);
                          }
                        }}
                        tabIndex={0}
                        aria-label={`Select DN ${row.dn} PN ${row.pn}`}
                      >
                        <td className="px-3 py-2.5 font-numeric font-semibold">DN {row.dn}</td>
                        <td className="px-3 py-2.5 font-numeric">{row.dims.D} mm</td>
                        <td className="px-3 py-2.5 font-numeric">{row.dims.k} mm</td>
                        <td className="px-3 py-2.5 font-numeric">{row.dims.d2} mm</td>
                        <td className="px-3 py-2.5 font-numeric">{row.dims.bolts}</td>
                        <td className="px-3 py-2.5 font-numeric">{row.dims.size}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-semibold ${
                              isCurrent
                                ? 'border-cyan-300/50 text-cyan-100'
                                : 'border-slate-600 text-slate-300'
                            }`}
                          >
                            {isCurrent ? 'Selected' : 'Use in calculator'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
