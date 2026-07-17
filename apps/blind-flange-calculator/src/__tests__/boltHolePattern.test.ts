import {describe, expect, it} from 'vitest';
import {boltHoleAngleAt, buildBoltHolePattern} from '../cad/geometry/build-bolt-hole-pattern';
import type {BlindFlangeCadGeometry} from '../cad/types/cad-types';

const geometry: BlindFlangeCadGeometry = {
  outerDiameter: 1250,
  thickness: 90,
  boltCircleDiameter: 1090,
  boltHoleCount: 28,
  boltHoleDiameter: 52,
  source: 'manual',
};

describe('buildBoltHolePattern', () => {
  it('offsets a 28-hole pattern half a pitch so drawing axes pass through bolt gaps', () => {
    const points = buildBoltHolePattern(geometry);

    expect(boltHoleAngleAt(0, geometry.boltHoleCount)).toBeCloseTo(Math.PI / 28);
    expect(points).toHaveLength(28);
    expect(points[0].x).toBeCloseTo((geometry.boltCircleDiameter / 2) * Math.cos(Math.PI / 28));
    expect(points[0].y).toBeCloseTo((geometry.boltCircleDiameter / 2) * Math.sin(Math.PI / 28));
    expect(points.some((point) => Math.abs(point.x) < 1e-9 || Math.abs(point.y) < 1e-9)).toBe(false);
  });
});
