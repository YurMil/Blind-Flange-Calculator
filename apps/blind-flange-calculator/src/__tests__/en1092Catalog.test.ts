import {describe, expect, it} from 'vitest';
import {getCalculatedPN} from '../domain/calculations/utils';
import {
  listEn1092PnClasses,
  listEn1092RowsForPn,
  pressureOpForPnClass,
} from '../domain/standards/en1092Catalog';
import {EN1092_DB} from '../domain/standards/data';

describe('en1092Catalog', () => {
  it('lists PN classes present in the embedded database', () => {
    const pns = listEn1092PnClasses();
    expect(pns).toEqual([10, 16, 25, 40, 63, 100, 160, 250, 320, 400]);
  });

  it('returns DN rows for a PN class sorted by DN', () => {
    const rows = listEn1092RowsForPn(16);
    expect(rows.length).toBeGreaterThan(10);
    expect(rows[0]?.dn).toBeLessThan(rows.at(-1)?.dn ?? 0);
    expect(rows.every((row) => row.pn === 16 && EN1092_DB[row.dn]?.[16])).toBe(true);

    const dn100 = rows.find((row) => row.dn === 100);
    expect(dn100?.dims).toEqual({D: 220, k: 180, bolts: 8, size: 'M16', d2: 18});
  });

  it('maps PN class to an operating pressure that selects that PN', () => {
    for (const pn of listEn1092PnClasses()) {
      expect(getCalculatedPN(pressureOpForPnClass(pn))).toBe(pn);
    }
  });
});
