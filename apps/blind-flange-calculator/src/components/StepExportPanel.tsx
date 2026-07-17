import {useMemo, useRef, useState} from 'react';
import {Box, Download, Loader2, X} from 'lucide-react';
import type {CalculationInput} from '../domain/types/bfTypes';
import type {BlindFlangeCadSource} from '../cad/types/cad-types';
import {computeBlindFlangeCadGeometry} from '../cad/geometry/compute-flange-geometry';
import {useBlindFlangeCad} from '../cad/hooks/useBlindFlangeCad';
import {CadWorkerError} from '../cad/services/cad-worker-client';
import type {BlindFlangeWorkerProgress} from '../cad/services/cad-worker-protocol';

type Props = {
  source: BlindFlangeCadSource;
  input: CalculationInput;
  targetPN: number;
};

const getProgressLabel = (message: BlindFlangeWorkerProgress) => {
  if (message.stage === 'init') {
    return message.done >= message.total ? 'CAD kernel ready.' : 'Initializing CAD kernel...';
  }

  if (message.stage === 'export') {
    return message.done >= message.total ? 'STEP export complete.' : 'Exporting STEP...';
  }

  const progressLabel =
    message.total > 0 ? ` (${Math.min(message.done, message.total)}/${message.total})` : '';
  return `Building blind flange geometry...${progressLabel}`;
};

const downloadStepFile = (
  stepBuffer: ArrayBuffer,
  input: CalculationInput,
  targetPN: number,
  outerDiameter: number,
) => {
  const blob = new Blob([stepBuffer], {type: 'application/step'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `blind-flange_DN${input.dn}_PN${targetPN}_${Math.round(outerDiameter)}mm.step`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function StepExportPanel({source, input, targetPN}: Props) {
  const {workerStatus, workerError, generateStep} = useBlindFlangeCad();
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasGeometrySource = useMemo(
    () => Boolean(source.manualCheck?.manualInput || source.designConfig || source.customResult || source.result),
    [source.customResult, source.designConfig, source.manualCheck, source.result],
  );

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
    setStatusText('');
    setErrorText('STEP generation cancelled.');
  };

  const handleDownloadStep = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setErrorText(null);
    setSuccessText(null);
    setStatusText('Initializing CAD kernel...');

    try {
      const geometry = computeBlindFlangeCadGeometry(source);
      const step = await generateStep(geometry, {
        signal: controller.signal,
        onProgress: (message) => {
          setStatusText(getProgressLabel(message));
        },
      });

      downloadStepFile(step, input, targetPN, geometry.outerDiameter);
      setSuccessText('STEP file generated successfully.');
      setStatusText('Done');
    } catch (error) {
      if (error instanceof CadWorkerError && error.code === 'cancelled') {
        setErrorText('STEP generation cancelled.');
      } else if (error instanceof CadWorkerError && error.code === 'timeout') {
        setErrorText(error.message);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        setErrorText(message);
      }
      setStatusText('');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  const helperText = (() => {
    if (isGenerating) {
      return statusText || 'Processing blind flange geometry in the browser...';
    }

    if (workerStatus === 'warming') {
      return 'CAD kernel is warming up in the background...';
    }

    if (successText) {
      return successText;
    }

    return 'Exports the current blind flange as a millimetre-based 3D STEP model (disk, facing features, bolt-hole pattern).';
  })();

  const facingNote = (() => {
    if (!source.gasketFacing || source.gasketFacing === 'FF') {
      return null;
    }
    if (source.gasketFacing === 'RF') {
      return 'RF export includes a raised-face boss. Height uses a screening PN heuristic (1.6 mm / 6.4 mm); diameter follows gasket OD when available.';
    }
    if (source.gasketFacing === 'RTJ') {
      return 'RTJ export cuts a rectangular-section ring groove (screening approximation of pitch/width/depth — not a certified ASME B16.5 groove table).';
    }
    if (source.gasketFacing === 'IBC') {
      return 'IBC is exported as a flat seating face (CUSTOM). No raised boss or ring groove is added.';
    }
    return null;
  })();

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
            <Box size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100">3D STEP export</p>
            <p className="mt-0.5 text-xs text-slate-400">{helperText}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isGenerating ? (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50 hover:bg-slate-800"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDownloadStep}
            disabled={!hasGeometrySource || isGenerating}
            className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>{isGenerating ? 'Generating STEP...' : 'Download STEP'}</span>
          </button>
        </div>
      </div>

      {errorText || workerError ? (
        <div className="mt-3 text-xs text-amber-200">{errorText ?? workerError}</div>
      ) : null}

      {facingNote ? <div className="mt-2 text-xs text-slate-500">{facingNote}</div> : null}
    </div>
  );
}
