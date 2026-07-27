import { EMPTY_MAP } from '@deephaven/utils';
import Toast, { TOAST_EVENT } from '../../events/Toast';
import Navigate, { NAVIGATE_EVENT } from '../../events/Navigate';
import { type UIEventHandler } from '../../events/EventPlugin';

export function getTargetName(target: EventTarget | null): string | undefined {
  if (target instanceof Element) {
    return (
      target.getAttribute('name') ?? target.getAttribute('id') ?? undefined
    );
  }
  return undefined;
}

/**
 * Widen a handler with a specific params type to the generic `UIEventHandler`
 * signature. The params are decoded from the server payload, so they are not
 * type checked at compile time.
 */
function asEventHandler<T>(handler: (params: T) => void): UIEventHandler {
  return handler as (params: unknown) => void;
}

/**
 * Map event names to their built-in handlers
 */
export const eventHandlerMap: Record<string, UIEventHandler> = {
  [TOAST_EVENT]: asEventHandler(Toast),
  [NAVIGATE_EVENT]: asEventHandler(Navigate),
};

/**
 * Get the handler for an event sent from the server. Built-in handlers take
 * precedence over handlers registered by plugins.
 *
 * @param name The name of the event
 * @param eventMap Map of event names to handlers registered by plugins
 * @returns The handler for the event, or null if there is no handler
 */
export function getHandlerForEvent(
  name: string,
  eventMap: ReadonlyMap<string, UIEventHandler> = EMPTY_MAP
): UIEventHandler | null {
  return eventHandlerMap[name] ?? eventMap.get(name) ?? null;
}

export default getTargetName;
