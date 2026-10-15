import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import Dashboard from './Dashboard';
import {
  type KeyProps,
  type LayoutElementType,
  type LayoutOptions,
} from './LayoutUtils';
import ReactPanel from './ReactPanel';

/** Prop a panel's id is passed to the panel in */
export const PANEL_ID_PROP = '__dhPanelId';

export type PanelIdentity = {
  /** Keys of the keyed rows, columns and stacks around the panel, then its own key. Unset if the panel isn't keyed. */
  key?: string;
  /** Position of the panel in the layout, which identifies an unkeyed panel within a session */
  path: string;
};

/** Serialize a panel's key path within its panel manager, or undefined if the panel isn't keyed */
export function getPanelKey(
  scope: readonly string[],
  key?: string
): string | undefined {
  if (key == null) {
    return undefined;
  }
  return JSON.stringify([...scope, key]);
}

/**
 * Normalize the layout and replace each panel in it, in render order.
 * Layout elements normalize their children again when they render, which leaves them unchanged.
 */
export function mapLayoutPanels(
  children: ReactNode,
  options: LayoutOptions,
  visit: (
    panel: ReactElement,
    identity: PanelIdentity,
    index: number
  ) => ReactNode
): ReactNode {
  let panelIndex = 0;

  function mapChildren(
    nodes: ReactNode,
    scope: readonly string[],
    path: string
  ): ReactNode {
    return Children.map(nodes, (child, index) => {
      if (!isValidElement<KeyProps & { children?: ReactNode }>(child)) {
        return child;
      }
      const { __dhKey: elementKey } = child.props;
      const childPath = `${path}/${
        elementKey == null ? index : `$${elementKey}`
      }`;

      if (child.type === ReactPanel) {
        const panel = visit(
          child,
          { key: getPanelKey(scope, elementKey), path: childPath },
          panelIndex
        );
        panelIndex += 1;
        return panel;
      }

      const { getLayoutChildren } = child.type as LayoutElementType;
      const layoutChildren = getLayoutChildren?.(child.props.children, options);
      if (layoutChildren === undefined) {
        return child;
      }
      const childScope =
        elementKey == null || child.type === Dashboard
          ? scope
          : [...scope, elementKey];
      return cloneElement(
        child,
        undefined,
        mapChildren(layoutChildren, childScope, childPath)
      );
    });
  }

  return mapChildren(children, EMPTY_ARRAY, '');
}

/** Identity of each panel in the layout, in render order */
export function getPanelIdentities(
  children: ReactNode,
  options: LayoutOptions
): PanelIdentity[] {
  const identities: PanelIdentity[] = [];
  mapLayoutPanels(children, options, (panel, identity) => {
    identities.push(identity);
    return panel;
  });
  return identities;
}

/** Pass each panel in the layout its id, from `ids` in render order */
export function setPanelIds(
  children: ReactNode,
  options: LayoutOptions,
  ids: readonly string[]
): ReactNode {
  return mapLayoutPanels(children, options, (panel, identity, index) =>
    cloneElement(panel, { [PANEL_ID_PROP]: ids[index] })
  );
}

/** 32-bit FNV-1a, so a new id is the same for the same identity */
function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // eslint-disable-next-line no-bitwise
  return (hash >>> 0).toString(36);
}

export type ResolvePanelIdsParams = {
  /** Identity of each panel, in render order */
  panels: readonly PanelIdentity[];
  /** Id of each keyed panel, by key */
  keyIds: ReadonlyMap<string, string>;
  /** Id of each unkeyed panel, by path */
  pathIds: ReadonlyMap<string, string>;
  /** Ids given out in order to panels without an id */
  orderedIds: readonly string[];
  /** Whether keyed panels without an id also take ordered ids */
  isKeyedOrdered: boolean;
  /** Prefix of new ids, unique to the panel manager */
  idPrefix: string;
};

export type PanelIdResolution = {
  /** Id of each panel, in render order */
  ids: readonly string[];
  /** Id of each key, from the first panel with that key */
  keyIds: ReadonlyMap<string, string>;
  /** Keys held by more than one panel */
  duplicateKeys: readonly string[];
};

/**
 * Give each panel an id. The same inputs always give the same ids.
 * 1. A panel keeps a known id: by key if it's keyed, by path otherwise.
 * 2. Panels without one take the ordered ids, in order.
 * 3. The rest get a new id derived from their identity.
 */
export function resolvePanelIds({
  panels,
  keyIds,
  pathIds,
  orderedIds,
  isKeyedOrdered,
  idPrefix,
}: ResolvePanelIdsParams): PanelIdResolution {
  const ids: (string | undefined)[] = panels.map(() => undefined);
  const usedIds = new Set<string>();
  const ownedKeys = new Map<string, string>();
  const duplicateKeys: string[] = [];

  function assign(index: number, id: string): void {
    ids[index] = id;
    usedIds.add(id);
    const { key } = panels[index];
    if (key != null && !ownedKeys.has(key)) {
      ownedKeys.set(key, id);
    }
  }

  // Known ids first, so a new panel can't take the id of a panel that keeps it
  panels.forEach(({ key, path }, index) => {
    if (key != null && ownedKeys.has(key)) {
      return;
    }
    const id = key != null ? keyIds.get(key) : pathIds.get(path);
    if (id != null && !usedIds.has(id)) {
      assign(index, id);
    }
  });

  let orderedIndex = 0;
  panels.forEach(({ key }, index) => {
    if (
      ids[index] != null ||
      (key != null && (!isKeyedOrdered || ownedKeys.has(key)))
    ) {
      return;
    }
    while (
      orderedIndex < orderedIds.length &&
      usedIds.has(orderedIds[orderedIndex])
    ) {
      orderedIndex += 1;
    }
    if (orderedIndex < orderedIds.length) {
      assign(index, orderedIds[orderedIndex]);
      orderedIndex += 1;
    }
  });

  panels.forEach(({ key, path }, index) => {
    if (ids[index] != null) {
      return;
    }
    let identity = key != null ? `key:${key}` : `path:${path}`;
    if (key != null && ownedKeys.has(key)) {
      duplicateKeys.push(key);
      identity += ':duplicate';
    }
    const baseId = `${idPrefix}-${hashString(identity)}`;
    let id = baseId;
    for (let n = 1; usedIds.has(id); n += 1) {
      id = `${baseId}-${n}`;
    }
    assign(index, id);
  });

  return { ids: ids as string[], keyIds: ownedKeys, duplicateKeys };
}

/** Ids from the last committed render, used to resolve the ids of the next one */
export type CommittedPanelIds = {
  /** Whether a render with the document ready has committed */
  hasBeenReady: boolean;
  keyIds: ReadonlyMap<string, string>;
  pathIds: ReadonlyMap<string, string>;
  /** Ids given out in order to the document's panels without an id */
  orderedIds: readonly string[];
};

/** Committed ids before the first render, from the saved ids */
export function getInitialCommittedPanelIds(
  panelIds: readonly string[] = EMPTY_ARRAY,
  panelKeyMap: Readonly<Record<string, string>> = {}
): CommittedPanelIds {
  const keyIds = new Map(Object.entries(panelKeyMap));
  const keyedIds = new Set(keyIds.values());
  return {
    hasBeenReady: false,
    keyIds,
    pathIds: EMPTY_MAP,
    // An unkeyed panel can't take a keyed panel's saved id
    orderedIds: panelIds.filter(id => !keyedIds.has(id)),
  };
}

/** Committed ids once a render commits, or `committed` if nothing changed */
export function commitPanelIds(
  committed: CommittedPanelIds,
  panels: readonly PanelIdentity[],
  resolution: PanelIdResolution,
  isDocumentReady: boolean,
  savedIds: readonly string[]
): CommittedPanelIds {
  if (isDocumentReady) {
    const pathIds = new Map<string, string>();
    panels.forEach(({ key, path }, index) => {
      if (key == null) {
        pathIds.set(path, resolution.ids[index]);
      }
    });
    const next: CommittedPanelIds = {
      hasBeenReady: true,
      keyIds: resolution.keyIds,
      pathIds,
      orderedIds: EMPTY_ARRAY,
    };
    return isSameCommittedPanelIds(committed, next) ? committed : next;
  }
  if (committed.hasBeenReady) {
    // Keep the document's ids while it reloads
    return committed;
  }
  // Lets the document's first unkeyed panels keep a new widget's loading placeholders
  const newIds = resolution.ids.filter(
    (id, index) =>
      panels[index].key == null &&
      !savedIds.includes(id) &&
      !committed.orderedIds.includes(id)
  );
  return newIds.length === 0
    ? committed
    : { ...committed, orderedIds: [...committed.orderedIds, ...newIds] };
}

function isSameMap(
  a: ReadonlyMap<string, string>,
  b: ReadonlyMap<string, string>
): boolean {
  return a.size === b.size && [...a].every(([key, id]) => b.get(key) === id);
}

function isSameCommittedPanelIds(
  a: CommittedPanelIds,
  b: CommittedPanelIds
): boolean {
  return (
    a.hasBeenReady === b.hasBeenReady &&
    a.orderedIds.length === b.orderedIds.length &&
    a.orderedIds.every((id, index) => b.orderedIds[index] === id) &&
    isSameMap(a.keyIds, b.keyIds) &&
    isSameMap(a.pathIds, b.pathIds)
  );
}
