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

export type EventListenerRemover = () => void;
export type EventListenFunction<TPayload = unknown> = (
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: TPayload) => void
) => EventListenerRemover;

export type EventEmitFunction<TPayload = unknown> = (
  eventHub: DashboardPanelProps['glEventHub'],
  payload: TPayload
) => void;

export type EventListenerHook<TPayload = unknown> = (
  eventHub: DashboardPanelProps['glEventHub'],
  handler: (p: TPayload) => void
) => void;

/**
 * Listen for an event
 * @param eventHub The event hub to listen to
 * @param event The event to listen for
 * @param handler The handler to call when the event is emitted
 * @returns A function to stop listening for the event
 */
export function listenForEvent<TPayload>(
  eventHub: DashboardPanelProps['glEventHub'],
  event: string,
  handler: (p: TPayload) => void
): EventListenerRemover {
  eventHub.on(event, handler);
  return () => {
    eventHub.off(event, handler);
  };
}

export function makeListenFunction<TPayload>(
  event: string
): EventListenFunction<TPayload> {
  return (eventHub, handler) => listenForEvent(eventHub, event, handler);
}

export function makeEmitFunction<TPayload>(
  event: string
): EventEmitFunction<TPayload> {
  return (eventHub, payload) => {
    eventHub.emit(event, payload);
  };
}

export function makeUseListenerFunction<TPayload>(
  event: string
): EventListenerHook<TPayload> {
  return (eventHub, handler) => {
    useEffect(
      () => listenForEvent(eventHub, event, handler),
      [eventHub, handler]
    );
  };
}

/**
 * Create listener, emitter, and hook functions for an event
 * @param event Name of the event to create functions for
 * @returns Listener, Emitter, and Hook functions for the event
 */
export function makeEventFunctions<TPayload>(event: string): {
  listen: EventListenFunction<TPayload>;
  emit: EventEmitFunction<TPayload>;
  useListener: EventListenerHook<TPayload>;
} {
  return {
    listen: makeListenFunction<TPayload>(event),
    emit: makeEmitFunction<TPayload>(event),
    useListener: makeUseListenerFunction<TPayload>(event),
  };
}

export interface PortalOpenedPayload {
  /**
   * Golden Layout Container object.
   * Can get the ID of the container using `LayoutUtils.getIdFromContainer` to identify this container.
   */
  container: DashboardPanelProps['glContainer'];

  /** Element to use for the portal */
  element: HTMLElement;
}

export interface PortalClosedPayload {
  /**
   * Golden Layout Container object.
   * Can get the ID of the container using `LayoutUtils.getIdFromContainer` to identify this container.
   */
  container: DashboardPanelProps['glContainer'];
}

export const {
  listen: listenForPortalOpened,
  emit: emitPortalOpened,
  useListener: usePortalOpenedListener,
} = makeEventFunctions<PortalOpenedPayload>(PORTAL_OPENED);

export const {
  listen: listenForPortalClosed,
  emit: emitPortalClosed,
  useListener: usePortalClosedListener,
} = makeEventFunctions<PortalClosedPayload>(PORTAL_CLOSED);
