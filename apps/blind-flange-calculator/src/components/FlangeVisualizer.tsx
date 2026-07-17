import {useMemo} from 'react';
import type {FlangeVisualizerProps} from '../domain/types/bfTypes';
import {boltHoleAngleAt} from '../cad/geometry/build-bolt-hole-pattern';

const VIEW = 320;
const CENTER = VIEW / 2;
const DRAW_DIAMETER = 220;

const STROKE = {
  outer: '#86efac',
  gasket: '#7dd3fc',
  boltCircle: '#fcd34d',
  hole: '#e2e8f0',
  dim: '#94a3b8',
  axis: '#64748b',
  plate: '#cbd5e1',
} as const;

const LegendSwatch = ({
  stroke,
  dash,
  label,
}: {
  stroke: string;
  dash?: string;
  label: string;
}) => (
  <div className="flex items-center gap-2 text-xs text-slate-300">
    <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true" className="shrink-0">
      <line
        x1="1"
        y1="6"
        x2="27"
        y2="6"
        stroke={stroke}
        strokeWidth="2.5"
        strokeDasharray={dash}
        strokeLinecap="round"
      />
    </svg>
    <span>{label}</span>
  </div>
);

function DimensionLine({
  y,
  halfLength,
  label,
}: {
  y: number;
  halfLength: number;
  label: string;
}) {
  const left = CENTER - halfLength;
  const right = CENTER + halfLength;
  const tick = 5;
  return (
    <g aria-hidden="true">
      <line x1={left} y1={y} x2={right} y2={y} stroke={STROKE.dim} strokeWidth={1} />
      <line x1={left} y1={y - tick} x2={left} y2={y + tick} stroke={STROKE.dim} strokeWidth={1} />
      <line x1={right} y1={y - tick} x2={right} y2={y + tick} stroke={STROKE.dim} strokeWidth={1} />
      <text
        x={CENTER}
        y={y - 6}
        textAnchor="middle"
        fontSize="10"
        fill={STROKE.dim}
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  );
}

export default function FlangeVisualizer({
  dn,
  dims,
  selectedPN,
  recommendedThickness,
  gasketMeanDiameter,
  gasketId,
  gasketOd,
}: FlangeVisualizerProps) {
  const boltPoints = useMemo(() => {
    if (!dims) return [];
    const radius = dims.k / 2;
    return Array.from({length: dims.bolts}, (_, index) => {
      const angle = boltHoleAngleAt(index, dims.bolts);
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    });
  }, [dims]);

  if (!dims) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span>Sketch</span>
          <span>DN {dn}</span>
        </div>
        <p className="mt-4 text-sm text-slate-400">No EN 1092-1 data available for DN {dn}.</p>
      </div>
    );
  }

  const scale = DRAW_DIAMETER / dims.D;
  const outerRadius = (dims.D / 2) * scale;
  const boltCircleRadius = (dims.k / 2) * scale;
  const boltRadius = Math.max((dims.d2 / 2) * scale, 2.5);
  const gasketOuterRadius = gasketOd ? (gasketOd / 2) * scale : null;
  const gasketInnerRadius = gasketId ? (gasketId / 2) * scale : null;
  const gasketMeanRadius = gasketMeanDiameter ? (gasketMeanDiameter / 2) * scale : null;
  const showUnknownGasket = !gasketOuterRadius && !gasketInnerRadius && !gasketMeanRadius;
  const thicknessMm = recommendedThickness ?? 0;
  const firstBolt = boltPoints[0];
  const gasketLabelRadius = gasketOuterRadius ?? gasketMeanRadius ?? gasketInnerRadius;

  // Side elevation: scale OD to a readable bar width; thickness exaggerated slightly for visibility.
  const sideWidth = 160;
  const sideScale = sideWidth / dims.D;
  const sideThickness = Math.max(thicknessMm * sideScale * 2.2, thicknessMm > 0 ? 8 : 4);
  const sideOd = dims.D * sideScale;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4 shadow-lg shadow-slate-950/40 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-400">
        <span>Sketch</span>
        <span>
          DN {dn}
          {selectedPN !== undefined ? ` · PN ${selectedPN}` : ''}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)] lg:items-start">
        <div className="min-w-0">
          <svg
            className="mx-auto block h-auto w-full max-w-md"
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            role="img"
            aria-label={`Blind flange plan view DN ${dn}, outer diameter ${dims.D} mm, bolt circle ${dims.k} mm`}
          >
            <title>
              {`Plan view DN ${dn}: D ${dims.D} mm, K ${dims.k} mm, ${dims.bolts} × ${dims.size}`}
            </title>
            <rect x={1} y={1} width={VIEW - 2} height={VIEW - 2} rx={20} fill="#020617" stroke="rgba(148, 163, 184, 0.35)" />

            <g aria-hidden="true" stroke={STROKE.axis} strokeWidth={1} strokeDasharray="9 5">
              <line x1={CENTER - outerRadius - 12} y1={CENTER} x2={CENTER + outerRadius + 12} y2={CENTER} />
              <line x1={CENTER} y1={CENTER - outerRadius - 12} x2={CENTER} y2={CENTER + outerRadius + 12} />
            </g>

            <circle
              cx={CENTER}
              cy={CENTER}
              r={outerRadius}
              fill="rgba(134, 239, 172, 0.12)"
              stroke={STROKE.outer}
              strokeWidth={2.5}
            />

            {gasketOuterRadius ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={gasketOuterRadius}
                fill="rgba(125, 211, 252, 0.08)"
                stroke={STROKE.gasket}
                strokeDasharray="7 5"
                strokeWidth={2}
              />
            ) : null}
            {gasketInnerRadius ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={gasketInnerRadius}
                fill="none"
                stroke={STROKE.gasket}
                strokeDasharray="3 4"
                strokeWidth={1.6}
              />
            ) : null}
            {!gasketOuterRadius && !gasketInnerRadius && gasketMeanRadius ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={gasketMeanRadius}
                fill="none"
                stroke={STROKE.gasket}
                strokeDasharray="7 5"
                strokeWidth={2}
              />
            ) : null}

            <circle
              cx={CENTER}
              cy={CENTER}
              r={boltCircleRadius}
              fill="none"
              stroke={STROKE.boltCircle}
              strokeDasharray="2 4"
              strokeWidth={2}
            />

            {boltPoints.map((point, index) => (
              <circle
                key={index}
                cx={CENTER + point.x * scale}
                cy={CENTER + point.y * scale}
                r={boltRadius}
                fill="#0f172a"
                stroke={STROKE.hole}
                strokeWidth={1.6}
              />
            ))}

            <DimensionLine y={CENTER + outerRadius + 18} halfLength={outerRadius} label={`ØD ${dims.D}`} />
            <DimensionLine y={CENTER - boltCircleRadius - 14} halfLength={boltCircleRadius} label={`K (BCD) ${dims.k}`} />

            {firstBolt ? (
              <g aria-hidden="true" stroke={STROKE.dim} fill={STROKE.dim} strokeWidth={1}>
                <line
                  x1={CENTER + firstBolt.x * scale + boltRadius}
                  y1={CENTER + firstBolt.y * scale - boltRadius}
                  x2={CENTER + outerRadius + 12}
                  y2={CENTER - boltCircleRadius * 0.3}
                />
                <text x={CENTER + outerRadius + 14} y={CENTER - boltCircleRadius * 0.3 + 3} fontSize="10" stroke="none">
                  d2
                </text>
              </g>
            ) : null}
            {gasketLabelRadius ? (
              <g aria-hidden="true" stroke={STROKE.dim} fill={STROKE.dim} strokeWidth={1}>
                <line
                  x1={CENTER - gasketLabelRadius * 0.72}
                  y1={CENTER + gasketLabelRadius * 0.72}
                  x2={CENTER - outerRadius - 10}
                  y2={CENTER + outerRadius * 0.56}
                />
                <text x={CENTER - outerRadius - 29} y={CENTER + outerRadius * 0.56 + 3} fontSize="10" stroke="none">
                  G
                </text>
              </g>
            ) : null}

            <text
              x={CENTER}
              y={CENTER + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
              fill="#f8fafc"
              fontWeight="700"
            >
              DN{dn}
            </text>
            {showUnknownGasket ? (
              <text x={CENTER} y={CENTER + 22} textAnchor="middle" fontSize="10" fill={STROKE.dim}>
                Gasket: unknown
              </text>
            ) : null}
          </svg>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thickness (side)</p>
          <svg
            className="mt-3 h-auto w-full"
            viewBox={`0 0 ${sideWidth + 24} ${sideThickness + 48}`}
            role="img"
            aria-label={
              thicknessMm > 0
                ? `Side view thickness ${thicknessMm} mm`
                : 'Side view thickness not available'
            }
          >
            <rect
              x={(sideWidth + 24 - sideOd) / 2}
              y={28}
              width={sideOd}
              height={sideThickness}
              rx={2}
              fill="rgba(203, 213, 225, 0.18)"
              stroke={STROKE.plate}
              strokeWidth={2}
            />
            <text
              x={(sideWidth + 24) / 2}
              y={18}
              textAnchor="middle"
              fontSize="11"
              fill={STROKE.dim}
              fontWeight="600"
            >
              {thicknessMm > 0 ? `t ${thicknessMm} mm` : 't —'}
            </text>
            <text
              x={(sideWidth + 24) / 2}
              y={sideThickness + 42}
              textAnchor="middle"
              fontSize="10"
              fill={STROKE.dim}
            >
              OD {dims.D} mm
            </text>
          </svg>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Side view is schematic (thickness exaggerated for readability). Use the plan view for bolt pattern.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Sketch legend">
        <LegendSwatch stroke={STROKE.outer} label="Outer flange" />
        <LegendSwatch stroke={STROKE.gasket} dash="7 5" label="Gasket envelope" />
        <LegendSwatch stroke={STROKE.boltCircle} dash="2 4" label="Bolt circle" />
        <LegendSwatch stroke={STROKE.hole} label="Bolt holes" />
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
        <div>
          <span className="text-slate-500">Outer D</span>
          <p className="font-semibold text-slate-100">{dims.D} mm</p>
        </div>
        <div>
          <span className="text-slate-500">Bolt circle K</span>
          <p className="font-semibold text-slate-100">{dims.k} mm</p>
        </div>
        <div>
          <span className="text-slate-500">Rec. plate thickness</span>
          <p className="font-semibold text-slate-100">{recommendedThickness ?? '—'} mm</p>
        </div>
      </div>
    </div>
  );
}
