import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { Stack as StackType, RowOrColumn } from '@deephaven/golden-layout';
import {
  type LayoutOptions,
  normalizeStackChildren,
  wrapBareChildrenInPanel,
  type StackElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { useInitialLayoutConfig } from './InitialLayoutConfigContext';

function LayoutStack({
  children,
  height,
  width,
  activeItemIndex,
}: StackElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const parent = useParentItem();

  const stack = useMemo(() => {
    const newStack = layoutManager.createContentItem(
      {
        type: 'stack',
        height,
        width,
        activeItemIndex,
      },
      parent
    );

    // The 3rd param prevents golden-layout from calling setSize
    // until we've mounted all of the rows and columns
    (parent as RowOrColumn).addChild(newStack, undefined, true);

    return newStack as StackType;
  }, [layoutManager, parent, height, width, activeItemIndex]);

  useEffect(() => {
    if (activeItemIndex != null) {
      stack.setActiveContentItem(stack.contentItems[activeItemIndex]);
    }
  }, [activeItemIndex, parent, stack]);

  return (
    <ParentItemContext.Provider value={stack}>
      {children}
    </ParentItemContext.Provider>
  );
}

function getStackChildren(
  children: React.ReactNode,
  { hasInitialLayout }: Pick<LayoutOptions, 'hasInitialLayout'>
): React.ReactNode {
  return hasInitialLayout
    ? wrapBareChildrenInPanel(children)
    : normalizeStackChildren(children);
}

function Stack({
  children,
  ...otherProps
}: StackElementProps): JSX.Element | null {
  // A persisted layout already has the stacks mapped out, so don't add a stack.
  // Bare content children still need a panel wrapper so they portal into their persisted panel.
  const hasInitialLayout = useInitialLayoutConfig() != null;
  const layoutChildren = getStackChildren(children, { hasInitialLayout });
  if (hasInitialLayout) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{layoutChildren}</>;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <LayoutStack {...otherProps}>{layoutChildren}</LayoutStack>;
}

Stack.getLayoutChildren = getStackChildren;

export default Stack;
