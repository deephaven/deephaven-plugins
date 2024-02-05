import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import type { ColumnElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Column({ children, width }: ColumnElementProps): JSX.Element | null {
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

export default Column;
