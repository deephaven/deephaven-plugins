import {
  ROLLUP_ROWS_DROPPABLE,
  PIVOT_COLUMNS_DROPPABLE,
  columnItemId,
} from './dndIds';
import {
  findColumnContainer,
  moveColumnAcross,
  reorderColumnWithin,
  type ColumnLists,
} from './columnMove';

/** Build a ColumnLists from plain column names for readability. */
function lists(rollup: string[], pivot: string[]): ColumnLists {
  return {
    [ROLLUP_ROWS_DROPPABLE]: rollup.map(columnItemId),
    [PIVOT_COLUMNS_DROPPABLE]: pivot.map(columnItemId),
  };
}

/** Read a container's item ids back as plain names. */
function names(l: ColumnLists, container: string): string[] {
  return l[container].map(id => id.slice('column:'.length));
}

describe('findColumnContainer', () => {
  const l = lists(['a', 'b'], ['c']);

  it('resolves a container id to itself', () => {
    expect(findColumnContainer(l, ROLLUP_ROWS_DROPPABLE)).toBe(
      ROLLUP_ROWS_DROPPABLE
    );
    expect(findColumnContainer(l, PIVOT_COLUMNS_DROPPABLE)).toBe(
      PIVOT_COLUMNS_DROPPABLE
    );
  });

  it('resolves an item id to the card that holds it', () => {
    expect(findColumnContainer(l, columnItemId('a'))).toBe(
      ROLLUP_ROWS_DROPPABLE
    );
    expect(findColumnContainer(l, columnItemId('c'))).toBe(
      PIVOT_COLUMNS_DROPPABLE
    );
  });

  it('returns null for ids in neither card', () => {
    expect(findColumnContainer(l, columnItemId('missing'))).toBeNull();
    expect(findColumnContainer(l, 'aggregations')).toBeNull();
  });
});

describe('moveColumnAcross', () => {
  it('inserts before the hovered item', () => {
    const next = moveColumnAcross(
      lists(['a', 'b'], ['c']),
      columnItemId('a'),
      columnItemId('c'),
      false
    );
    expect(names(next, ROLLUP_ROWS_DROPPABLE)).toEqual(['b']);
    expect(names(next, PIVOT_COLUMNS_DROPPABLE)).toEqual(['a', 'c']);
  });

  it('inserts after the hovered item when past its lower edge', () => {
    const next = moveColumnAcross(
      lists(['a'], ['c', 'd']),
      columnItemId('a'),
      columnItemId('c'),
      true
    );
    expect(names(next, PIVOT_COLUMNS_DROPPABLE)).toEqual(['c', 'a', 'd']);
  });

  it('appends when dropped on the destination container background', () => {
    const next = moveColumnAcross(
      lists(['a'], ['c', 'd']),
      columnItemId('a'),
      PIVOT_COLUMNS_DROPPABLE,
      false
    );
    expect(names(next, ROLLUP_ROWS_DROPPABLE)).toEqual([]);
    expect(names(next, PIVOT_COLUMNS_DROPPABLE)).toEqual(['c', 'd', 'a']);
  });

  it('is a no-op (same reference) within one card', () => {
    const l = lists(['a', 'b'], ['c']);
    expect(
      moveColumnAcross(l, columnItemId('a'), columnItemId('b'), false)
    ).toBe(l);
  });

  it('is a no-op for an unknown over target', () => {
    const l = lists(['a'], ['c']);
    expect(moveColumnAcross(l, columnItemId('a'), 'aggregations', false)).toBe(
      l
    );
  });
});

describe('reorderColumnWithin', () => {
  it('reorders within a card', () => {
    const next = reorderColumnWithin(
      lists(['a', 'b', 'c'], []),
      columnItemId('c'),
      columnItemId('a')
    );
    expect(names(next, ROLLUP_ROWS_DROPPABLE)).toEqual(['c', 'a', 'b']);
  });

  it('is a no-op (same reference) across cards', () => {
    const l = lists(['a'], ['c']);
    expect(reorderColumnWithin(l, columnItemId('a'), columnItemId('c'))).toBe(
      l
    );
  });

  it('is a no-op when the position is unchanged', () => {
    const l = lists(['a', 'b'], []);
    expect(reorderColumnWithin(l, columnItemId('a'), columnItemId('a'))).toBe(
      l
    );
  });
});
