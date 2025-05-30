import { createContext, useContext } from 'react';

/**
 * Context that holds the ID of the dashboard that we are currently in.
 */
export const DashboardContext = createContext<string>('');

/**
 * Gets the panel ID from the nearest panel context.
 * @returns The panel ID
 */
export function useDashboardId(): string {
  return useContext(DashboardContext);
}
