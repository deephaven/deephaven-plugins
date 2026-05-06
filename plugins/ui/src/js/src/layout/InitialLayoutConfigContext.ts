import { DashboardLayoutConfig } from '@deephaven/dashboard';
import { createContext, useContext } from 'react';

/**
 * Stores the initial layout config for a dashboard. This is used by rows and columns to determine if they need to add their layout components or not
 */
export const InitialLayoutConfigContext = createContext<
  DashboardLayoutConfig | undefined
>(undefined);

/**
 * Gets the initial layout config from the nearest context.
 * @returns The initial layout config or null if not set
 */
export function useInitialLayoutConfig(): DashboardLayoutConfig | undefined {
  return useContext(InitialLayoutConfigContext);
}
