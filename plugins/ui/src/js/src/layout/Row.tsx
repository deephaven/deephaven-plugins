import React, { Children, useEffect, useMemo } from 'react';
import { isElement } from 'react-is';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import type { RowElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import Stack from './Stack';
import Column from './Column';

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

  const hasColumns = Children.toArray(children).some(
    child => isElement(child) && child.type === Column
  );

  return (
    <ParentItemContext.Provider value={row}>
      {Children.map(children, child => {
        if (isElement(child) && child.type !== Column) {
          if (hasColumns) {
            return <Column>{child}</Column>;
          }

          if (child.type !== Stack) {
            return <Stack>{child}</Stack>;
          }
        }
        return child;
      })}
    </ParentItemContext.Provider>
  );
}

export default Row;
