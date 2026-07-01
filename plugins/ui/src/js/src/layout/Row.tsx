import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { RowOrColumn } from '@deephaven/golden-layout';
import { Flex } from '@deephaven/components';
import {
  normalizeRowChildren,
  wrapBareChildrenInPanel,
  type RowElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { usePanelId } from './ReactPanelContext';
import { useInitialLayoutConfig } from './InitialLayoutConfigContext';

function LayoutRow({ children, height }: RowElementProps): JSX.Element | null {
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
  const initialLayoutConfig = useInitialLayoutConfig();
  if (initialLayoutConfig != null) {
    // If there's already an initial layout defined, user has likely already customized their layout.
    // Don't add a row here, or normalize the children which might add a stack unnecessarily.
    // The persisted layout already has the rows/columns/stacks mapped out, but bare
    // content children still need a panel wrapper so they portal into their persisted panel.
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{wrapBareChildrenInPanel(children)}</>;
  }

  if (panelId == null) {
    return <LayoutRow height={height}>{children}</LayoutRow>;
  }

  return (
    <Flex height={`${height}%`} direction="row">
      {children}
    </Flex>
  );
}

export default Row;
