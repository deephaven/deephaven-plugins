import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
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

    parent.addChild(newColumn, undefined, true);

    return newColumn;
  }, [layoutManager, parent, width]);

  useEffect(() => {
    column.setSize();

    return () => {
      column.remove();
    };
  }, [column]);

  return (
    <ParentItemContext.Provider value={column}>
      {children}
    </ParentItemContext.Provider>
  );
}

export default Column;
