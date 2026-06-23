import { createContext, useContext } from 'react';
import { type NavigateParams } from './Navigate';

export type NavigateCallback = (params: NavigateParams) => void;

/**
 * Context that provides a navigate function scoped to a specific widget.
 * The WidgetHandler provides this so child components (e.g. Link) can
 * trigger navigation and have the URL state sent back to the backend.
 */
const NavigateContext = createContext<NavigateCallback | null>(null);

NavigateContext.displayName = 'NavigateContext';

export function useNavigateContext(): NavigateCallback | null {
  return useContext(NavigateContext);
}

export default NavigateContext;
