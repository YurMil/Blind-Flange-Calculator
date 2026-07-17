import {useState} from 'react';
import {FileDown, FileText, Loader2} from 'lucide-react';
import {buildDxf, buildDxfFromManual, downloadTextFile, exportPdfReport} from '../exportUtils';
import type {CalculationInput, CalculationResult, DesignConfiguration, GasketFacing} from '../domain/types/bfTypes';
import type {ManualCheckResult} from '../domain/types/manualCheckTypes';
import type {CustomSizingDebug} from '../domain/calculations/custom';
import StepExportPanel from './StepExportPanel';

type Props = {
  input: CalculationInput;
  result: CalculationResult | null;
  stepBaseResult?: CalculationResult | null;
  stepCustomResult?: CalculationResult | null;
  designConfig?: DesignConfiguration | null;
  gasketFacing: GasketFacing;
  manualCheckResult?: ManualCheckResult | null;
  targetPN: number;
  customDebug?: CustomSizingDebug | null;
};

export default function ExportActions({
  input,
  result,
  stepBaseResult,
  stepCustomResult,
  designConfig,
  gasketFacing,
  manualCheckResult,
  targetPN,
  customDebug,
}: Props) {
  const [isPdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePdf = async () => {
    if (!result && !manualCheckResult) return;
    try {
      setPdfLoading(true);
      setPdfError(null);
      await exportPdfReport({
        input,
        result,
        targetPN,
        debug: result?.source === 'custom' ? customDebug : null,
        manualCheck: manualCheckResult ?? undefined,
      });
    } catch (err) {
      console.error('PDF export failed', err);
      setPdfError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDxf = () => {
    if (manualCheckResult?.manualInput) {
      const dxf = buildDxfFromManual(manualCheckResult);
      if (!dxf) return;
      downloadTextFile(dxf, `blind-flange-manual-DN${input.dn}-PN${targetPN}.dxf`);
      return;
    }
    if (result) {
      const dxf = buildDxf(result);
      downloadTextFile(dxf, `blind-flange-DN${input.dn}-PN${targetPN}.dxf`);
    }
  };

  const disabledPdf = !result && !manualCheckResult;
  const disabledDxf = !result && !manualCheckResult?.manualInput;

  return (
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/55 p-5 shadow-lg shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">File generation</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Download configured flange</h2>
          <p className="text-xs text-slate-500">Generate files after the parameters and manual checks are set.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePdf}
          disabled={disabledPdf || isPdfLoading}
          className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
        >
          {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          <span>Export PDF</span>
        </button>
        <button
          type="button"
          onClick={handleDxf}
          disabled={disabledDxf}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
        >
          <FileDown size={16} />
          <span>Download DXF</span>
        </button>
      </div>
      </div>
      {pdfError ? <div className="text-xs text-amber-200">PDF export failed: {pdfError}</div> : null}
      <div className="mt-4">
        <StepExportPanel
          source={{
            manualCheck: manualCheckResult ?? null,
            result: stepBaseResult ?? null,
            customResult: stepCustomResult ?? null,
            designConfig: designConfig ?? null,
            gasketFacing,
          }}
          input={input}
          targetPN={targetPN}
        />
      </div>
    </section>
  );
}
