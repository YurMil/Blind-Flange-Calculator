import type {jsPDF} from 'jspdf';

export interface PdfDocContext {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
}

/** Shared page margin (mm) for every generated report. */
export const PDF_MARGIN_MM = 15;

/**
 * Creates a fresh jsPDF document plus the page-geometry constants shared by
 * every report builder. `jspdf` is imported dynamically so it stays out of
 * the main bundle until a report is actually requested.
 */
export async function createPdfDoc(): Promise<PdfDocContext> {
  const {jsPDF} = await import('jspdf');
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PDF_MARGIN_MM;
  const contentWidth = pageWidth - margin * 2;

  return {doc, pageWidth, pageHeight, margin, contentWidth};
}
