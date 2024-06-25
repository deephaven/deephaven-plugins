import { useContext } from 'react';
import { WidgetErrorContext } from './WidgetErrorContext';

/**
 * Gets the overlay content from the nearest panel context.
 * @returns The overlay content or null if not in a panel
 */
export function useWidgetError(): React.ReactNode | null {
  return useContext(WidgetErrorContext);
}

export default useWidgetError;
