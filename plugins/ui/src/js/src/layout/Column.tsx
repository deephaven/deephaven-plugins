import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import { Flex } from '@deephaven/components';
import {
  normalizeColumnChildren,
  type ColumnElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { usePanelId } from './ReactPanelContext';

function LayoutColumn({
  children,
  width,
}: ColumnElementProps): JSX.Element | null {
  console.log('xxx doing a LayoutColumn');
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

  const normalizedChildren = normalizeColumnChildren(children);

  return (
    <ParentItemContext.Provider value={column}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

function Column({ children, width }: ColumnElementProps): JSX.Element {
  const panelId = usePanelId();

  if (panelId == null) {
    return <LayoutColumn width={width}>{children}</LayoutColumn>;
  }

  return (
    <Flex width={`${width}%`} direction="column">
      {children}
    </Flex>
  );
}

export default Column;
