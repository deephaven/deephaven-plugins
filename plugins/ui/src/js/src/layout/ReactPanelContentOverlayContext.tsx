import { createContext } from 'react';

/** Context that defined a ReactNode to overlay on top of the content in a ReactPanel */
export const ReactPanelContentOverlayContext =
  createContext<React.ReactNode | null>(null);

export default ReactPanelContentOverlayContext;
