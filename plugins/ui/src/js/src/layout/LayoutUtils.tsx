import React, { isValidElement, Children } from 'react';
import type {
  RowOrColumn,
  Stack as GLStack,
  Root,
} from '@deephaven/golden-layout';
import {
  ELEMENT_KEY,
  ElementNode,
  isElementNode,
} from '../elements/ElementUtils';
import Column from './Column';
import Row from './Row';
import Stack from './Stack';
import ReactPanel from './ReactPanel';

export const PANEL_ELEMENT_NAME = 'deephaven.ui.components.Panel';
export const ROW_ELEMENT_NAME = 'deephaven.ui.components.Row';
export const COLUMN_ELEMENT_NAME = 'deephaven.ui.components.Column';
export const STACK_ELEMENT_NAME = 'deephaven.ui.components.Stack';
export const DASHBOARD_ELEMENT_NAME = 'deephaven.ui.components.Dashboard';

export type PanelElementType = typeof PANEL_ELEMENT_NAME;
export type RowElementType = typeof ROW_ELEMENT_NAME;
export type ColumnElementType = typeof COLUMN_ELEMENT_NAME;
export type StackElementType = typeof STACK_ELEMENT_NAME;
export type DashboardElementType = typeof DASHBOARD_ELEMENT_NAME;

export type GoldenLayoutParent = RowOrColumn | GLStack | Root;

export type ReactPanelProps = React.PropsWithChildren<{
  /** Title of the panel */
  title?: string;
}>;

/**
 * Describes a panel element that can be rendered in the UI.
 * Will be placed in the current dashboard, or within a user created dashboard if specified.
 */
export type PanelElementNode = ElementNode<PanelElementType, ReactPanelProps>;

/**
 * Check if an object is a PanelElementNode
 * @param obj Object to check
 * @returns True if the object is a PanelElementNode
 */
export function isPanelElementNode(obj: unknown): obj is PanelElementNode {
  return (
    isElementNode(obj) &&
    (obj as ElementNode)[ELEMENT_KEY] === PANEL_ELEMENT_NAME
  );
}

export type RowElementProps = React.PropsWithChildren<{
  height?: number;
}>;

/**
 * Describes a row element that can be rendered in the UI.
 */
export type RowElementNode = ElementNode<RowElementType, RowElementProps>;

/**
 * Check if an object is a RowElementNode
 * @param obj Object to check
 * @returns True if the object is a RowElementNode
 */
export function isRowElementNode(obj: unknown): obj is RowElementNode {
  return (
    isElementNode(obj) && (obj as ElementNode)[ELEMENT_KEY] === ROW_ELEMENT_NAME
  );
}

export type ColumnElementProps = React.PropsWithChildren<{
  width?: number;
}>;

/**
 * Describes a column element that can be rendered in the UI.
 */
export type ColumnElementNode = ElementNode<
  ColumnElementType,
  ColumnElementProps
>;

/**
 * Check if an object is a ColumnElementNode
 * @param obj Object to check
 * @returns True if the object is a ColumnElementNode
 */
export function isColumnElementNode(obj: unknown): obj is ColumnElementNode {
  return (
    isElementNode(obj) &&
    (obj as ElementNode)[ELEMENT_KEY] === COLUMN_ELEMENT_NAME
  );
}

export type StackElementProps = React.PropsWithChildren<{
  height?: number;
  width?: number;
  activeItemIndex?: number;
}>;

/**
 * Describes a stack element that can be rendered in the UI.
 */
export type StackElementNode = ElementNode<StackElementType, StackElementProps>;

/**
 * Check if an object is a StackElementNode
 * @param obj Object to check
 * @returns True if the object is a StackElementNode
 */
export function isStackElementNode(obj: unknown): obj is StackElementNode {
  return (
    isElementNode(obj) &&
    (obj as ElementNode)[ELEMENT_KEY] === STACK_ELEMENT_NAME
  );
}

export type DashboardElementProps = React.PropsWithChildren<
  Record<string, unknown>
>;

/**
 * Describes a dashboard element that can be rendered in the UI.
 */
export type DashboardElementNode = ElementNode<
  DashboardElementType,
  DashboardElementProps
>;

/**
 * Check if an object is a DashboardElementNode
 * @param obj Object to check
 * @returns True if the object is a DashboardElementNode
 */
export function isDashboardElementNode(
  obj: unknown
): obj is DashboardElementNode {
  return (
    isElementNode(obj) &&
    (obj as ElementNode)[ELEMENT_KEY] === DASHBOARD_ELEMENT_NAME
  );
}

/**
 * Normalizes the children of a dashboard element to create a fully defined layout.
 * GoldenLayout requires 1 root element.
 *
 * If there are multiple root elements, then we wrap in a row or column depending on the children.
 * If there are no layout elements, then we wrap in a column.
 * If there are only columns, then we wrap in a row.
 * If there are any rows (even if mixed with columns), then we wrap in a column.
 * @param children Children to normalize
 * @returns Normalized children
 */
export function normalizeDashboardChildren(
  children: React.ReactNode
): React.ReactNode {
  const needsWrapper = Children.count(children) > 1;
  const hasRows = Children.toArray(children).some(
    child => isValidElement(child) && child.type === Row
  );
  const hasColumns = Children.toArray(children).some(
    child => isValidElement(child) && child.type === Column
  );

  if (!hasRows && !hasColumns) {
    return <Column>{children}</Column>;
  }

  if (needsWrapper) {
    if (hasRows) {
      return <Column>{children}</Column>;
    }
    if (hasColumns) {
      return <Row>{children}</Row>;
    }
    return <Column>{children}</Column>;
  }
  return children;
}

/**
 * Normalizes the children of a row element to create a fully defined layout.
 * Rows can contain columns, stacks, or other rows.
 *
 * If there are no layout elements, we wrap each child in a stack.
 * E.g. row(t1, t2) will become row(stack(t1), stack(t2))
 *
 * If there are layout elements, we wrap any non-layout elements in a column.
 *
 * @param children Children to normalize
 * @returns Normalized children
 */
export function normalizeRowChildren(
  children: React.ReactNode
): React.ReactNode {
  const hasLayoutElements = Children.toArray(children).some(
    child =>
      isValidElement(child) && (child.type === Row || child.type === Column)
  );
  return Children.map(children, child => {
    if (isValidElement(child) && child.type !== Column && child.type !== Row) {
      if (hasLayoutElements) {
        return <Column>{child}</Column>;
      }
      if (child.type !== Stack) {
        return <Stack>{child}</Stack>;
      }
    }
    return child;
  });
}

/**
 * Normalizes the children of a column element to create a fully defined layout.
 * Columns can contain rows, stacks, or other columns.
 *
 * If there are no layout elements, we wrap each child in a stack.
 * E.g. column(t1, t2) will become column(stack(t1), stack(t2))
 *
 * If there are layout elements, we wrap any non-layout elements in a row.
 *
 * @param children Children to normalize
 * @returns Normalized children
 */
export function normalizeColumnChildren(
  children: React.ReactNode
): React.ReactNode {
  const hasLayoutElements = Children.toArray(children).some(
    child =>
      isValidElement(child) && (child.type === Row || child.type === Column)
  );
  return Children.map(children, child => {
    if (isValidElement(child) && child.type !== Row && child.type !== Column) {
      if (hasLayoutElements) {
        return <Row>{child}</Row>;
      }
      if (child.type !== Stack) {
        return <Stack>{child}</Stack>;
      }
    }
    return child;
  });
}

/**
 * Normalizes the children of a stack element to create a fully defined layout.
 * Stacks should only contain panels.
 * If a child is not a panel, it will be wrapped in a panel with a default title.
 *
 * @param children Children to normalize
 * @returns Normalized children
 */
export function normalizeStackChildren(
  children: React.ReactNode
): React.ReactNode {
  return Children.map(children, child => {
    if (isValidElement(child) && child.type !== ReactPanel) {
      return <ReactPanel title="Untitled">{child}</ReactPanel>;
    }
    return child;
  });
}
