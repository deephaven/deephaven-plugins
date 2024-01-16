import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import type { RowElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Row({ children, height }: RowElementProps): JSX.Element | null {
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

export default Row;
