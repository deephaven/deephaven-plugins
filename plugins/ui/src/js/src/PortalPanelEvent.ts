import { DashboardPanelProps } from '@deephaven/dashboard';

/**
 * Emitted when a portal panel is opened
 */
export const PORTAL_OPENED = 'PortalPanelEvent.PORTAL_OPENED';

/**
 * Emitted when a portal panel is closed
 */
export const PORTAL_CLOSED = 'PortalPanelEvent.PORTAL_CLOSED';

export interface ElementOpenedPayload {
  /** Golden Layout Container object. Can use the panel ID to identify this panel. */
  container: DashboardPanelProps['glContainer'];

  /** Element to use for the portal */
  element: HTMLElement;
}

export function listenForPortalOpened(
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: ElementOpenedPayload) => void
): void {
  eventHub.on(PORTAL_OPENED, handler);
}

export function emitPortalOpened(
  eventHub: DashboardPanelProps['glEventHub'],
  payload: ElementOpenedPayload
): void {
  eventHub.emit(PORTAL_OPENED, payload);
}

export interface ElementClosedPayload {
  /** Golden Layout Container object. Can use the panel ID to identify this panel. */
  container: DashboardPanelProps['glContainer'];
}

export function listenForPortalClosed(
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: ElementClosedPayload) => void
): void {
  eventHub.on(PORTAL_CLOSED, handler);
}

export function emitPortalClosed(
  eventHub: DashboardPanelProps['glEventHub'],
  payload: ElementClosedPayload
): void {
  eventHub.emit(PORTAL_CLOSED, payload);
}
