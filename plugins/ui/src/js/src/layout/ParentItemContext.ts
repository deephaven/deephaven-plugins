import { createContext, useContext } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { ContentItem } from '@deephaven/golden-layout';

export const ParentItemContext = createContext<ContentItem | null>(null);

export function useParentItem() {
  const layoutManager = useLayoutManager();
  const parentContextItem = useContext(ParentItemContext);
  return (
    parentContextItem ??
    layoutManager.root.contentItems[0] ??
    layoutManager.root
  );
}
