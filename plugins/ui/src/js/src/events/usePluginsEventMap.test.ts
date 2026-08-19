import { type PluginModuleMap } from '@deephaven/plugin';
import { getPluginsEventMap } from './usePluginsEventMap';

function makeEventPlugin(
  name: string,
  eventMapping: Record<string, (params: Record<string, unknown>) => void>
): [string, unknown] {
  return [name, { name, type: 'ElementPlugin', mapping: {}, eventMapping }];
}

function makeElementPlugin(name: string): [string, unknown] {
  return [name, { name, type: 'ElementPlugin', mapping: {} }];
}

it('extracts event handlers from event plugins', () => {
  const handlerA = jest.fn();
  const handlerB = jest.fn();
  const plugins = new Map([
    makeEventPlugin('plugin-a', { 'a.event': handlerA }),
    makeElementPlugin('plugin-element'),
    makeEventPlugin('plugin-b', { 'b.event': handlerB }),
  ]) as unknown as PluginModuleMap;

  const eventMap = getPluginsEventMap(plugins);

  expect(eventMap.size).toBe(2);
  expect(eventMap.get('a.event')).toBe(handlerA);
  expect(eventMap.get('b.event')).toBe(handlerB);
});

it('returns an empty map when there are no event plugins', () => {
  const plugins = new Map([
    makeElementPlugin('plugin-element'),
  ]) as unknown as PluginModuleMap;

  expect(getPluginsEventMap(plugins).size).toBe(0);
});

it('uses the last registered handler and warns on duplicate event names', () => {
  const first = jest.fn();
  const second = jest.fn();
  const plugins = new Map([
    makeEventPlugin('plugin-a', { 'dup.event': first }),
    makeEventPlugin('plugin-b', { 'dup.event': second }),
  ]) as unknown as PluginModuleMap;

  const eventMap = getPluginsEventMap(plugins);

  expect(eventMap.size).toBe(1);
  expect(eventMap.get('dup.event')).toBe(second);
});
