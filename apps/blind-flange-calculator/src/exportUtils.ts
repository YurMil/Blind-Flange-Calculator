import type {CalculationResult} from './domain/types/bfTypes';
import type {ManualCheckResult} from './domain/types/manualCheckTypes';
import {downloadBlob} from './download';
import {boltHoleAngleAt} from './cad/geometry/build-bolt-hole-pattern';

export {exportPdfReport} from './export/pdf';

export function buildDxf(result: CalculationResult): string {
  const outerRadius = result.dims.D / 2;
  const boltCircleRadius = result.dims.k / 2;
  const holeRadius = result.dims.d2 / 2;

  const header = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  const circle = (x: number, y: number, r: number, layer = 'FLANGE') => `0
CIRCLE
8
${layer}
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0
40
${r.toFixed(3)}
`;

  let body = '';
  body += circle(0, 0, outerRadius, 'OUTER');
  body += circle(0, 0, boltCircleRadius - 10, 'GASKET');

  for (let i = 0; i < result.dims.bolts; i++) {
    const angle = boltHoleAngleAt(i, result.dims.bolts);
    const x = boltCircleRadius * Math.cos(angle);
    const y = boltCircleRadius * Math.sin(angle);
    body += circle(x, y, holeRadius, 'BOLT');
  }

  const footer = `0
ENDSEC
0
EOF
`;

  return header + body + footer;
}

export function buildDxfFromManual(manualCheck: ManualCheckResult): string | null {
  const manual = manualCheck.manualInput;
  if (!manual) return null;

  const outerRadius = manual.outerDiameter / 2;
  const boltCircleRadius = manual.boltCircle / 2;
  const holeRadius = manual.boltHoleDiameter / 2;
  if (!outerRadius || !boltCircleRadius || !holeRadius) return null;

  const gasketMean = manualCheck.gasketSummary?.gasketMeanDiameter ?? 0;
  const gasketRadius = gasketMean > 0 ? gasketMean / 2 : Math.max(boltCircleRadius - 10, 0);

  const header = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  const circle = (x: number, y: number, r: number, layer = 'FLANGE') => `0
CIRCLE
8
${layer}
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0
40
${r.toFixed(3)}
`;

  let body = '';
  body += circle(0, 0, outerRadius, 'OUTER');
  if (gasketRadius > 0) {
    body += circle(0, 0, gasketRadius, 'GASKET');
  }

  for (let i = 0; i < manual.boltCount; i++) {
    const angle = boltHoleAngleAt(i, manual.boltCount);
    const x = boltCircleRadius * Math.cos(angle);
    const y = boltCircleRadius * Math.sin(angle);
    body += circle(x, y, holeRadius, 'BOLT');
  }

  const footer = `0
ENDSEC
0
EOF
`;

  return header + body + footer;
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], {type: 'application/octet-stream'});
  downloadBlob(blob, filename);
}
