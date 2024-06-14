import { ReactHTML } from 'react';
import type * as icons from '@deephaven/icons';

/** Namespaces */
export const UI_COMPONENTS_NAMESPACE = 'deephaven.ui.components';
export const UI_ELEMENTS_NAMESPACE = 'deephaven.ui.elements';

const uiComponentName = <T extends string>(name: T) =>
  `${UI_COMPONENTS_NAMESPACE}.${name}` as const;

const uiElementName = <T extends string>(name: T) =>
  `${UI_ELEMENTS_NAMESPACE}.${name}` as const;

export const ELEMENT_NAME = {
  /** Elements */
  uiTable: uiElementName('UITable'),

  /** Layout Components */
  column: uiComponentName('Column'),
  dashboard: uiComponentName('Dashboard'),
  panel: uiComponentName('Panel'),
  row: uiComponentName('Row'),
  stack: uiComponentName('Stack'),

  /** Other Components */
  actionGroup: uiComponentName('ActionGroup'),
  actionMenu: uiComponentName('ActionMenu'),
  fragment: uiComponentName('Fragment'),
  item: uiComponentName('Item'),
  listActionGroup: uiComponentName('ListActionGroup'),
  listActionMenu: uiComponentName('ListActionMenu'),
  listView: uiComponentName('ListView'),
  picker: uiComponentName('Picker'),
  radio: uiComponentName('Radio'),
  radioGroup: uiComponentName('RadioGroup'),
  section: uiComponentName('Section'),
} as const;

export type ElementName = typeof ELEMENT_NAME;

export const ELEMENT_PREFIX = {
  icon: 'deephaven.ui.icons.' as const,
  html: 'deephaven.ui.html.' as const,
};

export type ElementPrefix = {
  icon: `${typeof ELEMENT_PREFIX.icon}${keyof typeof icons}`;
  html: `${typeof ELEMENT_PREFIX.html}${keyof ReactHTML}`;
};
