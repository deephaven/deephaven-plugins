import React, { Children, useEffect, useMemo } from 'react';
import { isElement } from 'react-is';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import type { ColumnElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import Row from './Row';
import Stack from './Stack';

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

  const hasRows = Children.toArray(children).some(
    child => isElement(child) && child.type === Row
  );

  return (
    <ParentItemContext.Provider value={column}>
      {Children.map(children, child => {
        if (isElement(child) && child.type !== Row) {
          if (hasRows) {
            return <Row>{child}</Row>;
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

export default Column;
