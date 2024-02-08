import { DashboardPanelProps } from '@deephaven/dashboard';
import { useEffect } from 'react';

/**
 * Emitted when a portal panel is opened
 */
export const PORTAL_OPENED = 'PortalPanelEvent.PORTAL_OPENED';

/**
 * Emitted when a portal panel is closed
 */
export const PORTAL_CLOSED = 'PortalPanelEvent.PORTAL_CLOSED';

export interface PortalOpenedPayload {
  /** Golden Layout Container object. Can use the panel ID to identify this panel. */
  container: DashboardPanelProps['glContainer'];

  /** Element to use for the portal */
  element: HTMLElement;
}

/**
 * Listen for portal panel opened events
 * @param eventHub The event hub to listen to
 * @param handler The handler to call when a portal panel is opened
 * @returns A function to stop listening for portal panel opened events
 */
export function listenForPortalOpened(
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: PortalOpenedPayload) => void
): () => void {
  eventHub.on(PORTAL_OPENED, handler);
  return () => {
    eventHub.off(PORTAL_OPENED, handler);
  };
}

/**
 * Hook for listening for portal panel opened events
 * @param eventHub Event hub to listen on
 * @param handler Callback function when portal opened event is fired
 */
export function usePortalOpenedListener(
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: PortalOpenedPayload) => void
): void {
  useEffect(
    () => listenForPortalOpened(eventHub, handler),
    [eventHub, handler]
  );
}

/**
 * Emit a portal panel opened event
 * @param eventHub The event hub to emit the event on
 * @param payload The payload to emit
 */
export function emitPortalOpened(
  eventHub: DashboardPanelProps['glEventHub'],
  payload: PortalOpenedPayload
): void {
  eventHub.emit(PORTAL_OPENED, payload);
}

export interface PortalClosedPayload {
  /** Golden Layout Container object. Can use the panel ID to identify this panel. */
  container: DashboardPanelProps['glContainer'];
}

/**
 * Listen for portal panel closed events
 * @param eventHub The event hub to listen to
 * @param handler The handler to call when a portal panel is closed
 * @returns A function to stop listening for portal panel closed events
 */
export function listenForPortalClosed(
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: PortalClosedPayload) => void
): () => void {
  eventHub.on(PORTAL_CLOSED, handler);
  return () => {
    eventHub.off(PORTAL_CLOSED, handler);
  };
}

/**
 * Hook for listening for portal panel closed events
 * @param eventHub Event hub to listen on
 * @param handler Callback function when portal closed event is fired
 * @returns A function to stop listening for portal panel closed events
 */
export function usePortalClosedListener(
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: PortalClosedPayload) => void
): void {
  useEffect(
    () => listenForPortalClosed(eventHub, handler),
    [eventHub, handler]
  );
}

/**
 * Emit a portal panel closed event
 * @param eventHub The event hub to emit the event on
 * @param payload The payload to emit
 */
export function emitPortalClosed(
  eventHub: DashboardPanelProps['glEventHub'],
  payload: PortalClosedPayload
): void {
  eventHub.emit(PORTAL_CLOSED, payload);
}
