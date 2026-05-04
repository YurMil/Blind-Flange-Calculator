import {useEffect} from 'react';
import {HelpCircle, X} from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const Formula = ({children}: {children: React.ReactNode}) => (
  <code className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-cyan-100">{children}</code>
);

export default function CalculationHelpDialog({open, onClose}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        className="max-h-full w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculation-help-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <HelpCircle size={14} />
              Calculation help
            </div>
            <h2 id="calculation-help-title" className="mt-3 text-2xl font-semibold text-slate-100">
              How blind flange thickness is estimated
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              The tool gives a preliminary engineering estimate. Final design still needs project-code review.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            aria-label="Close calculation help"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-100">Algorithm</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              <li>1. Select DN, pressure, temperature, material, gasket and bolting data.</li>
              <li>2. Convert operating pressure to the nearest suitable PN class.</li>
              <li>3. Read EN 1092-1 flange geometry: outer diameter, bolt circle, bolt count and bolt size.</li>
              <li>4. Calculate hydrotest pressure and material allowable stresses at operating/test conditions.</li>
              <li>5. Calculate gasket effective diameter and loads for seating, operation and hydrotest.</li>
              <li>6. Calculate required plate thickness from pressure/gasket loads and add corrosion allowance.</li>
              <li>7. Round up to a practical plate thickness and estimate weight.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-100">Main formulas</h3>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              <p>
                Pressure force: <Formula>F = P * A</Formula>, where area is based on the gasket/nozzle effective
                diameter.
              </p>
              <p>
                Gasket seating load: <Formula>Wm1 = y * pi * G * b</Formula>.
              </p>
              <p>
                Operating gasket load: <Formula>Wm2 = P*pi*G^2/4 + 2*pi*b*G*m*P</Formula>.
              </p>
              <p>
                Bending arm: <Formula>a = (K - G) / 2</Formula>, where `K` is bolt circle and `G` is gasket mean
                diameter.
              </p>
              <p>
                Thickness estimate: <Formula>t = sqrt(C * W * a / (S * G))</Formula>.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-100">What increases thickness</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Higher operating or test pressure increases gasket and pressure loads.</p>
              <p>Larger DN increases loaded area and gasket diameter.</p>
              <p>Lower material allowable stress requires a thicker plate.</p>
              <p>Higher temperature usually reduces allowable stress.</p>
              <p>Larger bolt circle can increase bending lever arm.</p>
              <p>Higher corrosion allowance is added directly to required thickness.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-100">Checks included</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Bolt area is checked for seating, operating and hydrotest cases.</p>
              <p>Manual/check mode also evaluates plasticity and approximate deflection.</p>
              <p>Custom mode searches feasible bolt patterns and plate thickness when no standard PN geometry fits.</p>
              <p>PDF/DXF/STEP exports use the currently accepted configuration, not unfinished draft input text.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
