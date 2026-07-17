import {EN1092_DB} from './data';
import type {En1092Dimensions} from '../types/bfTypes';

export type En1092CatalogRow = {
  dn: number;
  pn: number;
  dims: En1092Dimensions;
};

/** PN classes present anywhere in the embedded EN 1092-1 Type 05 subset. */
export const listEn1092PnClasses = (): number[] => {
  const pnSet = new Set<number>();
  for (const pnMap of Object.values(EN1092_DB)) {
    for (const pnKey of Object.keys(pnMap)) {
      const pn = Number(pnKey);
      if (Number.isFinite(pn)) pnSet.add(pn);
    }
  }
  return [...pnSet].sort((a, b) => a - b);
};

/** All DN rows that have dimensions for the given PN class. */
export const listEn1092RowsForPn = (pn: number): En1092CatalogRow[] => {
  const rows: En1092CatalogRow[] = [];
  for (const [dnKey, pnMap] of Object.entries(EN1092_DB)) {
    const dims = pnMap[pn];
    if (!dims) continue;
    rows.push({dn: Number(dnKey), pn, dims});
  }
  return rows.sort((a, b) => a.dn - b.dn);
};

/**
 * Operating pressure (bar) that maps via `getCalculatedPN` to exactly this PN class.
 * Uses the PN designation itself (thresholds are `pressure <= PN`).
 */
export const pressureOpForPnClass = (pn: number): number => pn;
