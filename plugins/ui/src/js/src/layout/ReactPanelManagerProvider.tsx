import React, { useMemo } from 'react';
import {
  ReactPanelManager,
  ReactPanelManagerContext,
} from './ReactPanelManager';

export function ReactPanelManagerProvider({
  children,
  metadata,
  onOpen,
  onClose,
  getPanelId,
}: React.PropsWithChildren<ReactPanelManager>): JSX.Element {
  const manager = useMemo(
    () => ({
      metadata,
      onOpen,
      onClose,
      getPanelId,
    }),
    [metadata, onOpen, onClose, getPanelId]
  );
  return (
    <ReactPanelManagerContext.Provider value={manager}>
      {children}
    </ReactPanelManagerContext.Provider>
  );
}

export default ReactPanelManagerProvider;
