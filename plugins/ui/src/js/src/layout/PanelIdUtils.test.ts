import React, { type ReactNode } from 'react';
import Column from './Column';
import Dashboard from './Dashboard';
import { type LayoutOptions } from './LayoutUtils';
import ReactPanel from './ReactPanel';
import Row from './Row';
import Stack from './Stack';
import {
  commitPanelIds,
  getInitialCommittedPanelIds,
  getPanelIdentities,
  getPanelKey,
  type PanelIdentity,
  resolvePanelIds,
  type ResolvePanelIdsParams,
} from './PanelIdUtils';

const layoutOptions: LayoutOptions = {
  isNested: false,
  hasInitialLayout: false,
};

function panel(key?: string, children?: ReactNode): React.ReactElement {
  return React.createElement(
    ReactPanel as React.ElementType,
    { key, __dhKey: key },
    children
  );
}

function layout(
  type: typeof Row | typeof Column | typeof Stack,
  children: ReactNode[],
  key?: string
): React.ReactElement {
  return React.createElement(
    type as React.ElementType,
    { key, __dhKey: key },
    ...children
  );
}

function dashboard(...children: ReactNode[]): React.ReactElement {
  return React.createElement(Dashboard, null, ...children);
}

describe('getPanelKey', () => {
  it('returns undefined without a key', () => {
    expect(getPanelKey(['scope'])).toBeUndefined();
  });

  it('serializes the scope followed by the key', () => {
    expect(getPanelKey(['a', 'b'], 'c')).toBe(JSON.stringify(['a', 'b', 'c']));
  });

  it('does not collide on keys containing separators', () => {
    expect(getPanelKey([], 'a/b')).not.toBe(getPanelKey(['a'], 'b'));
  });
});

describe('getPanelIdentities', () => {
  it('identifies root panels by position, and keyed ones by key', () => {
    expect(getPanelIdentities([panel(), panel('a')], layoutOptions)).toEqual([
      { key: undefined, path: '/0' },
      { key: JSON.stringify(['a']), path: '/$a' },
    ]);
  });

  it('adds the keys of keyed rows, columns and stacks to the panel key', () => {
    const identities = getPanelIdentities(
      dashboard(
        layout(
          Row,
          [layout(Column, [layout(Stack, [panel('p')], 's')], 'c')],
          'r'
        )
      ),
      layoutOptions
    );

    expect(identities.map(({ key }) => key)).toEqual([
      JSON.stringify(['r', 'c', 's', 'p']),
    ]);
  });

  it('leaves unkeyed layout elements out of the panel key', () => {
    const identities = getPanelIdentities(
      dashboard(layout(Stack, [panel('a')]), layout(Stack, [panel('a')], 's')),
      layoutOptions
    );

    expect(identities.map(({ key }) => key)).toEqual([
      JSON.stringify(['a']),
      JSON.stringify(['s', 'a']),
    ]);
  });

  it('includes the panels the layout wraps around bare content', () => {
    const identities = getPanelIdentities(
      dashboard(layout(Stack, [panel('a'), React.createElement('div')])),
      layoutOptions
    );

    expect(identities).toEqual([
      expect.objectContaining({ key: JSON.stringify(['a']) }),
      expect.objectContaining({ key: undefined }),
    ]);
  });

  it('does not look inside panels', () => {
    expect(
      getPanelIdentities(
        [panel('a', layout(Stack, [panel('inner')]))],
        layoutOptions
      )
    ).toHaveLength(1);
  });

  it('skips a nested dashboard, which has its own panel manager', () => {
    expect(
      getPanelIdentities(dashboard(layout(Stack, [panel('a')])), {
        ...layoutOptions,
        isNested: true,
      })
    ).toEqual([]);
  });

  it('finds the same panels in a restored layout', () => {
    const document = dashboard(layout(Row, [panel('a'), panel('b')]));

    expect(
      getPanelIdentities(document, { ...layoutOptions, hasInitialLayout: true })
        .length
    ).toBe(getPanelIdentities(document, layoutOptions).length);
  });
});

describe('resolvePanelIds', () => {
  const keyA = JSON.stringify(['a']);
  const keyB = JSON.stringify(['b']);

  function resolve(
    panels: PanelIdentity[],
    params: Partial<ResolvePanelIdsParams> = {}
  ) {
    return resolvePanelIds({
      panels,
      keyIds: new Map(),
      pathIds: new Map(),
      orderedIds: [],
      isKeyedOrdered: false,
      idPrefix: 'new',
      ...params,
    });
  }

  it('gives panels their known ids, by key or by path', () => {
    const { ids } = resolve([{ key: keyA, path: '/$a' }, { path: '/1' }], {
      keyIds: new Map([[keyA, 'a-id']]),
      pathIds: new Map([['/1', 'path-id']]),
    });

    expect(ids).toEqual(['a-id', 'path-id']);
  });

  it('gives the ordered ids in order to unkeyed panels without an id, skipping ids in use', () => {
    const { ids } = resolve(
      [{ path: '/0' }, { key: keyA, path: '/$a' }, { path: '/2' }],
      {
        keyIds: new Map([[keyA, 'first']]),
        orderedIds: ['first', 'second'],
      }
    );

    expect(ids).toEqual(['second', 'first', expect.stringMatching(/^new-/)]);
  });

  it('gives keyed panels ordered ids only when asked to', () => {
    const panels = [{ key: keyA, path: '/$a' }];

    expect(resolve(panels, { orderedIds: ['first'] }).ids).toEqual([
      expect.stringMatching(/^new-/),
    ]);
    expect(
      resolve(panels, { orderedIds: ['first'], isKeyedOrdered: true }).ids
    ).toEqual(['first']);
  });

  it('gives a duplicate key a new id and reports it', () => {
    const { ids, keyIds, duplicateKeys } = resolve(
      [
        { key: keyA, path: '/$a' },
        { key: keyA, path: '/$a' },
      ],
      { keyIds: new Map([[keyA, 'a-id']]) }
    );

    expect(ids).toEqual(['a-id', expect.stringMatching(/^new-/)]);
    expect(keyIds).toEqual(new Map([[keyA, 'a-id']]));
    expect(duplicateKeys).toEqual([keyA]);
  });

  it('gives the same new ids to the same panels', () => {
    const panels = [{ key: keyA, path: '/$a' }, { path: '/1' }];

    expect(resolve(panels).ids).toEqual(resolve(panels).ids);
  });

  it('gives different panels different new ids', () => {
    const { ids } = resolve([
      { key: keyA, path: '/$a' },
      { key: keyA, path: '/$a' },
      { key: keyB, path: '/$b' },
      { path: '/3' },
    ]);

    expect(new Set(ids).size).toBe(4);
  });

  it('keeps the known id of a panel after it, rather than giving it to a new panel', () => {
    const { ids } = resolve(
      [
        { key: keyB, path: '/$b' },
        { key: keyA, path: '/$a' },
      ],
      { keyIds: new Map([[keyA, 'a-id']]) }
    );

    expect(ids[1]).toBe('a-id');
  });
});

describe('commitPanelIds', () => {
  const keyA = JSON.stringify(['a']);
  const panels: PanelIdentity[] = [{ key: keyA, path: '/$a' }, { path: '/1' }];
  const resolution = {
    ids: ['a-id', 'new-id'],
    keyIds: new Map([[keyA, 'a-id']]),
    duplicateKeys: [],
  };

  it('keeps the ids of the ready document, and stops giving out ordered ids', () => {
    const committed = commitPanelIds(
      getInitialCommittedPanelIds(['a-id', 'saved-id']),
      panels,
      resolution,
      true,
      ['a-id', 'saved-id']
    );

    expect(committed).toEqual({
      hasBeenReady: true,
      keyIds: new Map([[keyA, 'a-id']]),
      pathIds: new Map([['/1', 'new-id']]),
      orderedIds: [],
    });
  });

  it('returns the committed ids when nothing changed', () => {
    const committed = commitPanelIds(
      getInitialCommittedPanelIds(),
      panels,
      resolution,
      true,
      []
    );

    expect(commitPanelIds(committed, panels, resolution, true, [])).toBe(
      committed
    );
  });

  it('keeps the committed ids while the document reloads', () => {
    const committed = commitPanelIds(
      getInitialCommittedPanelIds(),
      panels,
      resolution,
      true,
      []
    );

    expect(
      commitPanelIds(
        committed,
        [{ path: '/0' }],
        { ids: ['placeholder-id'], keyIds: new Map(), duplicateKeys: [] },
        false,
        []
      )
    ).toBe(committed);
  });

  it("orders a new widget's placeholder ids after the saved ones", () => {
    const committed = commitPanelIds(
      getInitialCommittedPanelIds(['saved-id']),
      [{ path: '/0' }, { path: '/1' }],
      { ids: ['saved-id', 'new-id'], keyIds: new Map(), duplicateKeys: [] },
      false,
      ['saved-id']
    );

    expect(committed.orderedIds).toEqual(['saved-id', 'new-id']);
  });

  it('starts with the saved ids that are not keyed in order', () => {
    expect(
      getInitialCommittedPanelIds(['a-id', 'unkeyed-id'], { [keyA]: 'a-id' })
    ).toEqual({
      hasBeenReady: false,
      keyIds: new Map([[keyA, 'a-id']]),
      pathIds: new Map(),
      orderedIds: ['unkeyed-id'],
    });
  });
});
