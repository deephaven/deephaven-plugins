import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import { Flex } from '@deephaven/components';
import { normalizeRowChildren, type RowElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { usePanelId } from './ReactPanelContext';

function LayoutRow({ children, height }: RowElementProps): JSX.Element | null {
  console.log('xxx doing a LayoutRow');
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

  const normalizedChildren = normalizeRowChildren(children);

  return (
    <ParentItemContext.Provider value={row}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

function Row({ children, height }: RowElementProps): JSX.Element {
  const panelId = usePanelId();

  if (panelId == null) {
    return <LayoutRow height={height}>{children}</LayoutRow>;
  }

  console.log('xxx doing a flexRow with panelId', panelId);
  return (
    <Flex height={`${height}%`} direction="row">
      {children}
    </Flex>
  );
}

export default Row;
