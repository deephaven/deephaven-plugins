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

  const normalizedChildren = normalizeColumnChildren(children);

  return (
    <ParentItemContext.Provider value={column}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

function Column({ children, width }: ColumnElementProps): JSX.Element {
  const panelId = usePanelId();
  const initialLayoutConfig = useInitialLayoutConfig();
  if (initialLayoutConfig != null) {
    // If there's already an initial layout defined, user has likely already customized their layout.
    // Don't add a row here, or normalize the children which might add a stack unnecessarily.
    // Just render the children as they are, and the initial layout config should already have the panels mapped out.
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

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
