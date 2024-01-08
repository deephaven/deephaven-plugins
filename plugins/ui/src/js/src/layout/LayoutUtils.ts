import React from 'react';
import type { RowOrColumn, Stack, Root } from '@deephaven/golden-layout';
import { ELEMENT_KEY, ElementNode, isElementNode } from '../ElementUtils';

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

export type GoldenLayoutParent = RowOrColumn | Stack | Root;

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
  Record<string, never>
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

// export function createLayoutElement(
//   type: 'column' | 'row' | 'stack',
//   root: RowOrColumn | Stack,
//   props: Record<string, unknown> = {}
// ) {}
