import type {CalculationInput, CalculationResult} from '../../domain/types/bfTypes';
import type {CustomSizingDebug} from '../../domain/calculations/custom';
import type {ManualCheckResult} from '../../domain/types/manualCheckTypes';
import {downloadBlob} from '../../download';
import {renderStandardReport} from './standardReport';
import {renderManualReport} from './manualReport';

export type {StandardReportParams} from './standardReport';
export type {ManualReportParams} from './manualReport';

export interface ExportPdfReportParams {
  input: CalculationInput;
  result?: CalculationResult | null;
  targetPN: number;
  debug?: CustomSizingDebug | null;
  manualCheck?: ManualCheckResult;
}

/**
 * Builds and downloads the calculation-report PDF. Dispatches to the manual
 * or standard/custom report builder depending on whether a manual check was
 * supplied, then triggers a browser download with the matching filename.
 */
export async function exportPdfReport(params: ExportPdfReportParams): Promise<void> {
  const {input, result, targetPN, debug, manualCheck} = params;

  if (manualCheck) {
    const blob = await renderManualReport({input, targetPN, manualCheck});
    const fileSuffix = input.dn ? `DN${input.dn}` : 'DN';
    downloadBlob(blob, `blind-flange-manual-check-${fileSuffix}-PN${targetPN}.pdf`);
    return;
  }

  if (!result) return;

  const blob = await renderStandardReport({input, result, targetPN, debug});
  downloadBlob(blob, `blind-flange-report-DN${input.dn}-PN${targetPN}.pdf`);
}
