import type {Shape3D} from 'replicad';
import type {BlindFlangeCadGeometry} from '../types/cad-types';

type ReplicadModule = typeof import('replicad');

const getReplicadExport = <TExport,>(
  replicadModule: ReplicadModule,
  exportName: string,
): TExport | undefined => {
  const moduleWithDefault = replicadModule as ReplicadModule & {default?: ReplicadModule};
  return (moduleWithDefault as unknown as Record<string, TExport | undefined>)[exportName] ??
    (moduleWithDefault.default as unknown as Record<string, TExport | undefined> | undefined)?.[exportName];
};

type MakeCylinder = (
  radius: number,
  height: number,
  location?: [number, number, number],
  direction?: [number, number, number],
) => Shape3D;

/**
 * Add facing features on top of the base flange disk (z = thickness face).
 * - FF / CUSTOM: unchanged
 * - RF: fuse raised-face cylinder
 * - RTJ: cut rectangular-section annular groove (screening approximation)
 */
export const buildFacingFeatures = (
  replicadModule: ReplicadModule,
  solid: Shape3D,
  geometry: BlindFlangeCadGeometry,
): Shape3D => {
  const facingType = geometry.facingType ?? 'FF';
  if (facingType === 'FF' || facingType === 'CUSTOM') {
    return solid;
  }

  const makeCylinder = getReplicadExport<MakeCylinder>(replicadModule, 'makeCylinder');
  if (!makeCylinder) {
    throw new Error('Replicad makeCylinder() export was not found while building facing features.');
  }

  if (facingType === 'RF') {
    const diameter = geometry.raisedFaceDiameter ?? 0;
    const height = geometry.raisedFaceHeight ?? 0;
    if (diameter <= 0 || height <= 0) {
      return solid;
    }

    const raisedFace = makeCylinder(diameter / 2, height, [0, 0, geometry.thickness], [0, 0, 1]);
    return solid.fuse(raisedFace);
  }

  if (facingType === 'RTJ') {
    const pitch = geometry.rtjPitchDiameter ?? 0;
    const width = geometry.rtjGrooveWidth ?? 0;
    const depth = geometry.rtjGrooveDepth ?? 0;
    if (pitch <= 0 || width <= 0 || depth <= 0) {
      return solid;
    }

    const outerRadius = pitch / 2 + width / 2;
    const innerRadius = pitch / 2 - width / 2;
    if (innerRadius <= 0 || outerRadius <= innerRadius) {
      throw new Error('RTJ groove radii are invalid for the derived pitch diameter and width.');
    }

    // Overcut slightly past the face so boolean cut is robust.
    const cutDepth = depth + 0.2;
    const zStart = geometry.thickness - depth;
    const outer = makeCylinder(outerRadius, cutDepth, [0, 0, zStart], [0, 0, 1]);
    const inner = makeCylinder(innerRadius, cutDepth + 0.4, [0, 0, zStart - 0.2], [0, 0, 1]);
    const grooveRing = outer.cut(inner);
    return solid.cut(grooveRing);
  }

  return solid;
};
