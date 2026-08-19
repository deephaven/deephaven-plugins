import { useMemo } from 'react';
import { usePlugins } from '@deephaven/plugin';
import Log from '@deephaven/log';
import { type UIEventHandler, isEventPlugin } from './EventPlugin';

const log = Log.module('usePluginsEventMap');

/**
 * Get a mapping of event names to their handlers from the given plugin map.
 *
 * If multiple plugins register a handler for the same event name, the last one
 * registered wins and a warning is logged.
 *
 * @param pluginMap The plugin map to extract event plugins from.
 * @returns A Map of event names to their handlers.
 */
export function getPluginsEventMap(
  pluginMap: ReturnType<typeof usePlugins>
): Map<string, UIEventHandler> {
  const eventMap = new Map<string, UIEventHandler>();
  [...pluginMap.values()].filter(isEventPlugin).forEach(plugin => {
    Object.entries(plugin.eventMapping).forEach(([name, handler]) => {
      if (eventMap.has(name)) {
        log.warn(
          `Multiple plugins registered a handler for event "${name}". The last one registered will be used.`
        );
      }
      eventMap.set(name, handler);
    });
  });
  return eventMap;
}

/**
 * Get all event handlers registered by {@link EventPlugin}s from the plugins
 * context.
 * @returns A Map of event names to their handlers.
 */
export function usePluginsEventMap(): Map<string, UIEventHandler> {
  const plugins = usePlugins();
  return useMemo(() => getPluginsEventMap(plugins), [plugins]);
}

export default usePluginsEventMap;
