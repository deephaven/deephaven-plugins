import React from 'react';
import { useContextOrThrow } from '@deephaven/react-hooks';

/** Map from the panel IDs to the element for that panel */
export type PortalPanelMap = ReadonlyMap<string, HTMLElement>;

export const PortalPanelManagerContext =
  React.createContext<PortalPanelMap | null>(null);

export function usePortalPanelManager() {
  return useContextOrThrow(PortalPanelManagerContext, 'PortalPanelManager');
}

export default PortalPanelManagerContext;
