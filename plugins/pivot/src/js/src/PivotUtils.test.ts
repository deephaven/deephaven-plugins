import { dh } from '@deephaven-enterprise/jsapi-coreplus-types';
import { getColumnGroups } from './PivotUtils';

describe('keyMapToColumnGroups', () => {
  it('creates correct column groups from key map', () => {
    const keyMap = new Map<number, readonly (string | null)[]>([
      [1, ['A', null]],
      [2, ['A', 'B']],
      [3, ['E', null]],
    ]);
    const valueSources = [{ name: 'V' }, { name: 'W' }];
    const columnGroups = getColumnGroups(
      keyMap,
      valueSources as dh.coreplus.pivot.PivotSource[]
    );
    expect(columnGroups).toEqual(
      expect.objectContaining({
        name: 'A',
        depth: 2,
        childIndexes: [],
        children: expect.arrayContaining(['A/TOTALS', 'A/B']),
        displayName: 'A',
        parent: undefined,
      })
    );

    expect(columnGroups.get('A/B')).toEqual(
      expect.objectContaining({
        name: 'A/B',
        depth: 1,
        childIndexes: [],
        children: expect.arrayContaining(['A/B/V', 'A/B/W']),
        displayName: 'A/B',
        parent: 'A',
      })
    );

    expect(columnGroups.get('A/TOTALS')).toEqual(
      expect.objectContaining({
        name: 'A/TOTALS',
        depth: 1,
        childIndexes: [],
        children: expect.arrayContaining(['A/TOTALS/V', 'A/TOTALS/W']),
        displayName: 'Totals',
        parent: 'A',
      })
    );

    expect(columnGroups.get('E')).toEqual(
      expect.objectContaining({
        name: 'E',
        depth: 2,
        childIndexes: [],
        children: ['E/TOTALS'],
        displayName: 'E',
        parent: undefined,
      })
    );

    expect(columnGroups.get('E/TOTALS')).toEqual(
      expect.objectContaining({
        name: 'E/TOTALS',
        depth: 1,
        childIndexes: [],
        children: expect.arrayContaining(['E/TOTALS/V', 'E/TOTALS/W']),
        displayName: 'Totals',
        parent: 'E',
      })
    );
  });

  it('handles 3 levels of grouping', () => {
    const keyMap = new Map<number, readonly (string | null)[]>([
      [2, ['A', 'B', 'C']],
    ]);
    const valueSources = [{ name: 'V' }, { name: 'W' }];
    const columnGroups = keyMapToColumnGroups(
      keyMap,
      valueSources as dh.coreplus.pivot.PivotSource[]
    );
    expect(columnGroups.get('A')).toEqual(
      expect.objectContaining({
        name: 'A',
        depth: 3,
        childIndexes: [],
        children: expect.arrayContaining(['A/TOTALS', 'A/B']),
        displayName: 'A',
        parent: undefined,
      })
    );

    expect(columnGroups.get('A/TOTALS')).toEqual(
      expect.objectContaining({
        name: 'A/TOTALS',
        depth: 2,
        childIndexes: [],
        children: ['A/TOTALS/V', 'A/TOTALS/W'],
        displayName: 'Totals',
        parent: 'A',
      })
    );

    expect(columnGroups.get('A/B')).toEqual(
      expect.objectContaining({
        name: 'A/B',
        depth: 2,
        childIndexes: [],
        children: expect.arrayContaining(['A/B/TOTALS', 'A/B/C']),
        displayName: 'A/B',
        parent: 'A',
      })
    );

    expect(columnGroups.get('A/B/TOTALS')).toEqual(
      expect.objectContaining({
        name: 'A/B/TOTALS',
        depth: 1,
        childIndexes: [],
        children: expect.arrayContaining(['A/B/TOTALS/V', 'A/B/TOTALS/W']),
        displayName: 'Totals',
        parent: 'A/B',
      })
    );
  });
});
