import React, { useEffect, useState } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Row({ children, height }: RowElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const parent = useParentItem();
  const [row] = useState(() => {
    const newRow = layoutManager.createContentItem(
      {
        type: 'row',
        height,
      },
      parent
    );

    parent.addChild(newRow, undefined, true);

    return newRow;
  });

  useEffect(() => {
    row.setSize();

    return () => {
      row.remove();
    };
  }, [row]);

  return (
    <ParentItemContext.Provider value={row}>
      {children}
    </ParentItemContext.Provider>
  );
}

export default Row;
