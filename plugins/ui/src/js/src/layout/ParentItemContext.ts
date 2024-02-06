import { createContext, useContext, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { ContentItem } from '@deephaven/golden-layout';

export const ParentItemContext = createContext<ContentItem | null>(null);

export function useParentItem() {
  const layoutManager = useLayoutManager();
  const parentContextItem = useContext(ParentItemContext);
  const parentItem = useMemo(
    () => parentContextItem ?? layoutManager.root,
    [layoutManager.root, parentContextItem]
  );
  return parentItem;
}
