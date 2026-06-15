import { IrisGridTableOptionsContext } from '@deephaven/iris-grid';
import { createWidgetMiddleware } from './createMiddleware';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';

/**
 * Middleware that wraps the base widget component (the non-panel
 * `WidgetComponentProps` path, e.g. dashboard widgets via
 * `GridWidgetPlugin`) in an `IrisGridTableOptionsContext.Provider`.
 */
export const TableOptionsExampleMiddleware = createWidgetMiddleware(() => {
  const extension = useComposedTableOptionsExtension();
  return {
    wrap: child => (
      <IrisGridTableOptionsContext.Provider value={extension}>
        {child}
      </IrisGridTableOptionsContext.Provider>
    ),
  };
}, 'TableOptionsExampleMiddleware');

export default TableOptionsExampleMiddleware;
