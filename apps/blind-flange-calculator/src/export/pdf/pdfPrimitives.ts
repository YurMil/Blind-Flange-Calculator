import type {jsPDF} from 'jspdf';
import {sanitizePdfText} from './pdfText';

export const toFixed = (value: number, digits = 2) => Number.parseFloat(value.toFixed(digits));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Shared value formatters used across both report builders. */
export const fmt = {
  mm: (v: number, digits = 1) => `${toFixed(v, digits)} mm`,
  bar: (v: number, digits = 1) => `${toFixed(v, digits)} bar`,
  mm2: (v: number, digits = 0) => `${toFixed(v, digits)} mm^2`,
  n: (v: number, digits = 0) => `${toFixed(v, digits)} N`,
  kn: (v: number, digits = 1) => `${toFixed(v / 1000, digits)} kN`,
  nm: (v: number, digits = 0) => `${toFixed(v, digits)} N*m`,
  pct: (u: number, digits = 0) => `${toFixed(u * 100, digits)}%`,
};

/** Draws a shaded section-header band and returns the Y position for content below it. */
export function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
  contentWidth: number,
): number {
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(sanitizePdfText(title.toUpperCase()), margin + 2, y + 5);
  return y + 9;
}

/** Draws a label/value pair, right-aligning the value within `width`. */
export function drawField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): void {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(sanitizePdfText(label), x, y);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText(value), x + width, y, {align: 'right'});
}

/** Draws word-wrapped body text and returns the Y position after the last line. */
export function drawWrapped(doc: jsPDF, text: string, x: number, y: number, width: number, fontSize = 9): number {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const safeText = sanitizePdfText(text);
  const lines = doc.splitTextToSize(safeText, width) as string[];
  doc.text(lines, x, y);
  return y + lines.length * (fontSize * 0.35 + 1.5);
}

/** Draws a labelled horizontal utilization bar (green/amber/red) with a trailing percentage. */
export function drawBar(doc: jsPDF, label: string, utilization: number, x: number, y: number, width: number): void {
  const normalized = Number.isFinite(utilization) ? utilization : 0;
  const pct = clamp(normalized * 100, 0, 300);
  const fillWidth = clamp(normalized, 0, 1) * width;
  const color = pct < 90 ? [60, 179, 113] : pct < 110 ? [255, 193, 7] : [244, 67, 54];
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(sanitizePdfText(label), x, y + 4);
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y + 6, fillWidth, 5, 'F');
  doc.setDrawColor(60);
  doc.rect(x, y + 6, width, 5);
  doc.setTextColor(0);
  doc.text(sanitizePdfText(`${pct.toFixed(0)}%`), x + width, y + 4, {align: 'right'});
}

export type KeyValueRow = [string, string] | null | undefined | false;

/**
 * Draws a stacked list of label/value rows (each with a thin separator line
 * below it), skipping falsy entries. Returns the Y position immediately
 * after the last drawn row (i.e. `y + rowCount * rowHeight`), matching the
 * `drawField` + separator-line loops that used to be duplicated in both
 * report builders.
 */
export function drawKeyValueRows(
  doc: jsPDF,
  rows: readonly KeyValueRow[],
  x: number,
  y: number,
  width: number,
  rowHeight = 6,
): number {
  let rowIdx = 0;
  rows.forEach((row) => {
    if (!row) return;
    const [label, value] = row;
    const rowBaseY = y + rowIdx * rowHeight;
    drawField(doc, label, value, x + 2, rowBaseY + 4, width - 4);
    doc.setDrawColor(230);
    doc.line(x, rowBaseY + 6, x + width, rowBaseY + 6);
    rowIdx += 1;
  });
  return y + rowIdx * rowHeight;
}
