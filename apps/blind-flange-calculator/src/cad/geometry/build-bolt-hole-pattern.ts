import type {BoltHoleCenter, BlindFlangeCadGeometry} from '../types/cad-types';

/**
 * Place the first hole half a pitch away from the primary centre lines.
 *
 * For the usual even bolt counts this leaves the horizontal and vertical
 * drawing axes running through bolt gaps, rather than through a hole. The
 * same convention is reused by the STEP model, PDF/DXF drawings and UI sketch.
 */
export const boltHoleAngleAt = (index: number, boltHoleCount: number) =>
  (2 * Math.PI * (index + 0.5)) / boltHoleCount;

export const buildBoltHolePattern = (geometry: BlindFlangeCadGeometry): BoltHoleCenter[] => {
  const radius = geometry.boltCircleDiameter / 2;

  return Array.from({length: geometry.boltHoleCount}, (_, index) => {
    const angle = boltHoleAngleAt(index, geometry.boltHoleCount);
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  });
};
