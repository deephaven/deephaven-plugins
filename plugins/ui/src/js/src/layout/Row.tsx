import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import { Flex } from '@deephaven/components';
import {
  type LayoutOptions,
  normalizeRowChildren,
  wrapBareChildrenInPanel,
  type RowElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { usePanelId } from './ReactPanelContext';
import { useInitialLayoutConfig } from './InitialLayoutConfigContext';

function LayoutRow({ children, height }: RowElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const parent = useParentItem();
  const row = useMemo(() => {
    const newRow = layoutManager.createContentItem(
      {
        type: 'row',
        height,
      },
      parent
    );

    // The 3rd param prevents golden-layout from calling setSize
    // until we've mounted all of the rows and columns
    (parent as RowOrColumn).addChild(newRow, undefined, true);

    return newRow;
  }, [layoutManager, parent, height]);

  useEffect(() => {
    row.setSize();
  }, [row]);

  return (
    <ParentItemContext.Provider value={row}>
      {children}
    </ParentItemContext.Provider>
  );
}

function getRowChildren(
  children: React.ReactNode,
  { hasInitialLayout }: Pick<LayoutOptions, 'hasInitialLayout'>
): React.ReactNode {
  return hasInitialLayout
    ? wrapBareChildrenInPanel(children)
    : normalizeRowChildren(children);
}

function Row({ children, height }: RowElementProps): JSX.Element {
  const panelId = usePanelId();
  const initialLayoutConfig = useInitialLayoutConfig();

  if (panelId != null) {
    // We're inside a panel (e.g. ui.panel(ui.row(...))), so render as a Flex
    // regardless of any persisted layout. Wrapping bare children in a panel here
    // would nest a panel inside a panel and throw a NestedPanelError.
    return (
      <Flex height={`${height}%`} direction="row">
        {children}
      </Flex>
    );
  }

  // A persisted layout already has the rows/columns/stacks mapped out, so don't add a row.
  // Bare content children still need a panel wrapper so they portal into their persisted panel.
  const hasInitialLayout = initialLayoutConfig != null;
  const layoutChildren = getRowChildren(children, { hasInitialLayout });
  if (hasInitialLayout) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{layoutChildren}</>;
  }

  return <LayoutRow height={height}>{layoutChildren}</LayoutRow>;
}

Row.getLayoutChildren = getRowChildren;

export default Row;
