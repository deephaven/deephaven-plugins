import { ReactHTML } from 'react';
import type * as icons from '@deephaven/icons';

/** Namespaces */
export const UI_COMPONENTS_NAMESPACE = 'deephaven.ui.components';
export const UI_ELEMENTS_NAMESPACE = 'deephaven.ui.elements';

/** Table */
export const UITABLE_ELEMENT_TYPE = `${UI_ELEMENTS_NAMESPACE}.UITable` as const;
export type UITableElementName = typeof UITABLE_ELEMENT_TYPE;

/** Layout */
export const PANEL_ELEMENT_NAME = `${UI_COMPONENTS_NAMESPACE}.Panel` as const;
export const ROW_ELEMENT_NAME = `${UI_COMPONENTS_NAMESPACE}.Row` as const;
export const COLUMN_ELEMENT_NAME = `${UI_COMPONENTS_NAMESPACE}.Column` as const;
export const STACK_ELEMENT_NAME = `${UI_COMPONENTS_NAMESPACE}.Stack` as const;
export const DASHBOARD_ELEMENT_NAME =
  `${UI_COMPONENTS_NAMESPACE}.Dashboard` as const;

export type PanelElementType = typeof PANEL_ELEMENT_NAME;
export type RowElementType = typeof ROW_ELEMENT_NAME;
export type ColumnElementType = typeof COLUMN_ELEMENT_NAME;
export type StackElementType = typeof STACK_ELEMENT_NAME;
export type DashboardElementType = typeof DASHBOARD_ELEMENT_NAME;

/** Icons */
export const ICON_ELEMENT_TYPE_PREFIX = 'deephaven.ui.icons.';
export type IconElementName =
  `${typeof ICON_ELEMENT_TYPE_PREFIX}${keyof typeof icons}`;

/** HTML */
export const HTML_ELEMENT_NAME_PREFIX = 'deephaven.ui.html.';
export type HTMLElementType =
  `${typeof HTML_ELEMENT_NAME_PREFIX}${keyof ReactHTML}`;

/** Specific Components */
export const FRAGMENT_ELEMENT_NAME =
  `${UI_COMPONENTS_NAMESPACE}.Fragment` as const;
export const ITEM_ELEMENT_NAME = `${UI_COMPONENTS_NAMESPACE}.Item` as const;
export const LIST_VIEW_NAME = `${UI_COMPONENTS_NAMESPACE}.ListView` as const;
export const PICKER_ELEMENT_NAME = `${UI_COMPONENTS_NAMESPACE}.Picker` as const;
export const SECTION_ELEMENT_NAME =
  `${UI_COMPONENTS_NAMESPACE}.Section` as const;
