import {
  type ElementPlugin,
  isElementPlugin,
  type PluginModuleExport,
} from '@deephaven/plugin';

/**
 * A handler for an event sent from deephaven.ui via `use_send_event`.
 * The params are the JSON-decoded payload of the event, with any callables
 * re-hydrated into callable functions.
 */
export type UIEventHandler = (params: Record<string, unknown>) => void;

/** A mapping of event names to their handlers. */
export type UIEventMapping = Record<string, UIEventHandler>;

/**
 * An event plugin is an {@link ElementPlugin} that additionally handles custom
 * events sent from deephaven.ui via `use_send_event`. The `eventMapping`
 * contains the event names as keys and the handlers as values.
 *
 * Event names should be namespaced with the plugin's package namespace to avoid
 * collisions. Built-in events are namespaced with `deephaven.ui`.
 *
 * Because an event plugin is also an element plugin, the `mapping` property is
 * still required. If the plugin only handles events and does not render any
 * elements, set `mapping` to an empty object.
 */
export interface EventPlugin extends ElementPlugin {
  eventMapping: UIEventMapping;
}

/** Type guard to check if the given plugin is an {@link EventPlugin}. */
export function isEventPlugin(
  plugin: PluginModuleExport
): plugin is EventPlugin {
  return (
    isElementPlugin(plugin) &&
    'eventMapping' in plugin &&
    (plugin as Partial<EventPlugin>).eventMapping != null
  );
}
