import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import { Flex } from '@deephaven/components';
import {
  type LayoutOptions,
  normalizeColumnChildren,
  wrapBareChildrenInPanel,
  type ColumnElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { usePanelId } from './ReactPanelContext';
import { useInitialLayoutConfig } from './InitialLayoutConfigContext';

function LayoutColumn({
  children,
  width,
}: ColumnElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const parent = useParentItem();

  const column = useMemo(() => {
    const newColumn = layoutManager.createContentItem(
      {
        type: 'column',
        width,
      },
      parent
    );

    // The 3rd param prevents golden-layout from calling setSize
    // until we've mounted all of the rows and columns
    (parent as RowOrColumn).addChild(newColumn, undefined, true);

    return newColumn;
  }, [layoutManager, parent, width]);

  useEffect(() => {
    column.setSize();
  }, [column]);

  return (
    <ParentItemContext.Provider value={column}>
      {children}
    </ParentItemContext.Provider>
  );
}

function getColumnChildren(
  children: React.ReactNode,
  { hasInitialLayout }: Pick<LayoutOptions, 'hasInitialLayout'>
): React.ReactNode {
  return hasInitialLayout
    ? wrapBareChildrenInPanel(children)
    : normalizeColumnChildren(children);
}

function Column({ children, width }: ColumnElementProps): JSX.Element {
  const panelId = usePanelId();
  const initialLayoutConfig = useInitialLayoutConfig();

  if (panelId != null) {
    // We're inside a panel (e.g. ui.panel(ui.column(...))), so render as a Flex
    // regardless of any persisted layout. Wrapping bare children in a panel here
    // would nest a panel inside a panel and throw a NestedPanelError.
    return (
      <Flex width={`${width}%`} direction="column">
        {children}
      </Flex>
    );
  }

  // A persisted layout already has the rows/columns/stacks mapped out, so don't add a column.
  // Bare content children still need a panel wrapper so they portal into their persisted panel.
  const hasInitialLayout = initialLayoutConfig != null;
  const layoutChildren = getColumnChildren(children, { hasInitialLayout });
  if (hasInitialLayout) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{layoutChildren}</>;
  }

  return <LayoutColumn width={width}>{layoutChildren}</LayoutColumn>;
}

Column.getLayoutChildren = getColumnChildren;

export default Column;
