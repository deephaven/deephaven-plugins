import { type ComponentType } from 'react';
import { type OptionType, type IrisGridModel } from '@deephaven/iris-grid';
import { type IconDefinition } from '@deephaven/icons';

/**
 * Local copies of the Table Options props contract added to
 * `@deephaven/iris-grid` in web-client-ui (PR #2688). Duplicated here
 * until that version is published and installed, at which point these
 * can be replaced with imports from `@deephaven/iris-grid`.
 */

/**
 * Built-in items use the `OptionType` enum; plugin-contributed items use
 * a namespaced string key (convention `plugin:<name>:<id>`).
 */
export type OptionItemKey = OptionType | string;

/**
 * Props passed to a plugin-supplied sidebar page (an item whose
 * `configPage` is set).
 */
export type IrisGridTableOptionsPageProps = {
  /** Current model the grid is rendering. */
  model: IrisGridModel;
  /** Pop the current page off the sidebar stack. */
  onBack: () => void;
};

/** A single entry in the Table Options sidebar menu. */
export type OptionItem = {
  type: OptionItemKey;
  title: string;
  subtitle?: string;
  icon?: IconDefinition;
  isOn?: boolean;
  onChange?: () => void;
  /**
   * Optional sort weight for positioning the item within the menu. Items
   * are stably sorted by ascending `order`; an omitted `order` sinks the
   * item to the end of the menu. Built-in items are numbered with a stride
   * of 100.
   */
  order?: number;
  configPage?: ComponentType<IrisGridTableOptionsPageProps>;
};

/**
 * Transform applied to the built-in Table Options items before they are
 * rendered. Must be referentially stable and side-effect-free.
 */
export type TableOptionsTransform = (
  defaults: readonly OptionItem[]
) => readonly OptionItem[];

/**
 * Opt-in props for components that wrap `<IrisGrid>` / `<IrisGridPanel>`,
 * threaded down the middleware chain.
 */
export interface IrisGridTableOptionsWidgetProps {
  transformTableOptions?: TableOptionsTransform;
}
