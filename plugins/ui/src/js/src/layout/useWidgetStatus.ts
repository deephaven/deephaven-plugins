import { useContextOrThrow } from '@deephaven/react-hooks';
import { WidgetStatus, WidgetStatusContext } from './WidgetStatusContext';

/**
 * Gets the widget status from the closest WidgetStatusContext.
 * @returns Widget status or throws an error if WidgetStatusContext is not set
 */
export function useWidgetStatus(): WidgetStatus {
  return useContextOrThrow(WidgetStatusContext);
}

export default useWidgetStatus;
