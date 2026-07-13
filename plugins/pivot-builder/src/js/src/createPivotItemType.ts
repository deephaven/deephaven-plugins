import type { PluginOptionKey } from '@deephaven/iris-grid';

/**
 * Stable type key for the Create Pivot sidebar item. Typed as
 * `PluginOptionKey` so the `plugin:<plugin-name>:<id>` convention is enforced
 * at compile time, keeping plugin contributions from colliding with built-in
 * `OptionType` values or with other plugins.
 */
// eslint-disable-next-line import/prefer-default-export
export const CREATE_PIVOT_ITEM_TYPE: PluginOptionKey =
  'plugin:pivot-builder:create-pivot';
