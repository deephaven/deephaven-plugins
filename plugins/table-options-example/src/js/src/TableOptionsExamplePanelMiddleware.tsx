import { IrisGridTableOptionsContext } from '@deephaven/iris-grid';
import { createPanelMiddleware } from './createMiddleware';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';

/**
 * Middleware that wraps the panel widget (`IrisGridPanel` host) in an
 * `IrisGridTableOptionsContext.Provider`. Same composition rules as the
 * non-panel `TableOptionsExampleMiddleware`.
 *
 * Built with `createPanelMiddleware`, which owns the `forwardRef` ceremony and
 * forwards the ref golden-layout injects on the registered panel down to the
 * inner `IrisGridPanel`. That ref is how golden-layout persists the panel's
 * React state (sorts, filters, column moves, etc.) into its `componentState`,
 * so the factory guarantees it can never be accidentally dropped.
 */
export const TableOptionsExamplePanelMiddleware = createPanelMiddleware(() => {
  const extension = useComposedTableOptionsExtension();
  return {
    wrap: child => (
      <IrisGridTableOptionsContext.Provider value={extension}>
        {child}
      </IrisGridTableOptionsContext.Provider>
    ),
  };
}, 'TableOptionsExamplePanelMiddleware');

export default TableOptionsExamplePanelMiddleware;
