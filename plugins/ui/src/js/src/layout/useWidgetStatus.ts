import { useContextOrThrow } from '@deephaven/react-hooks';
import { WidgetStatus, WidgetStatusContext } from './WidgetStatusContext';

/**
 * Gets the overlay content from the nearest panel context.
 * @returns The overlay content or null if not in a panel
 */
export function useWidgetStatus(): WidgetStatus {
  return useContextOrThrow(WidgetStatusContext);
}

export default useWidgetStatus;
