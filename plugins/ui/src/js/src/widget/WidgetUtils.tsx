/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/prefer-default-export */
import React, { ComponentType } from 'react';
// Importing `Item` and `Section` compnents directly since they should not be
// wrapped due to how Spectrum collection components consume them.
import {
  ActionMenu,
  ButtonGroup,
  SpectrumCheckbox as Checkbox,
  Content,
  ContextualHelp,
  Flex,
  Grid,
  Heading,
  IllustratedMessage,
  Item,
  ListActionGroup,
  ListActionMenu,
  NumberField,
  Section,
  Switch,
  TabList,
  Text,
  ToggleButton,
  View,
} from '@deephaven/components';
import { ValueOf } from '@deephaven/utils';
import { ReadonlyWidgetData, WidgetAction, isWidgetError } from './WidgetTypes';
import {
  ElementNode,
  ELEMENT_KEY,
  isElementNode,
  wrapElementChildren,
  wrapTextChildren,
} from '../elements/utils/ElementUtils';
import HTMLElementView from '../elements/HTMLElementView';
import { isHTMLElementNode } from '../elements/utils/HTMLElementUtils';
import { isIconElementNode } from '../elements/utils/IconElementUtils';
import IconElementView from '../elements/IconElementView';
import { ELEMENT_NAME, ElementName } from '../elements/model/ElementConstants';
import ReactPanel from '../layout/ReactPanel';
import Row from '../layout/Row';
import Stack from '../layout/Stack';
import Column from '../layout/Column';
import Dashboard from '../layout/Dashboard';
import {
  ActionButton,
  ActionGroup,
  Button,
  Form,
  ListView,
  Picker,
  Radio,
  RadioGroup,
  RangeSlider,
  Slider,
  TabPanels,
  TextField,
  UITable,
  Tabs,
} from '../elements';

/**
 * Elements to implicitly wrap primitive children in <Text> components.
 */
const shouldWrapTextChildren = new Set<string>([
  ELEMENT_NAME.column,
  ELEMENT_NAME.flex,
  ELEMENT_NAME.grid,
  ELEMENT_NAME.view,
]);

/*
 * Map element node names to their corresponding React components
 */
export const elementComponentMap = {
  // Elements
  [ELEMENT_NAME.uiTable]: UITable,

  // Layout
  [ELEMENT_NAME.column]: Column,
  [ELEMENT_NAME.dashboard]: Dashboard,
  [ELEMENT_NAME.panel]: ReactPanel,
  [ELEMENT_NAME.row]: Row,
  [ELEMENT_NAME.stack]: Stack,

  // Other components
  [ELEMENT_NAME.actionButton]: ActionButton,
  [ELEMENT_NAME.actionGroup]: ActionGroup,
  [ELEMENT_NAME.actionMenu]: ActionMenu,
  [ELEMENT_NAME.button]: Button,
  [ELEMENT_NAME.buttonGroup]: ButtonGroup,
  [ELEMENT_NAME.checkbox]: Checkbox,
  [ELEMENT_NAME.content]: Content,
  [ELEMENT_NAME.contextualHelp]: ContextualHelp,
  [ELEMENT_NAME.flex]: Flex,
  [ELEMENT_NAME.form]: Form,
  [ELEMENT_NAME.fragment]: React.Fragment,
  [ELEMENT_NAME.grid]: Grid,
  [ELEMENT_NAME.heading]: Heading,
  [ELEMENT_NAME.illustratedMessage]: IllustratedMessage,
  [ELEMENT_NAME.item]: Item,
  [ELEMENT_NAME.listActionGroup]: ListActionGroup,
  [ELEMENT_NAME.listActionMenu]: ListActionMenu,
  [ELEMENT_NAME.listView]: ListView,
  [ELEMENT_NAME.numberField]: NumberField,
  [ELEMENT_NAME.picker]: Picker,
  [ELEMENT_NAME.radio]: Radio,
  [ELEMENT_NAME.radioGroup]: RadioGroup,
  [ELEMENT_NAME.rangeSlider]: RangeSlider,
  [ELEMENT_NAME.section]: Section,
  [ELEMENT_NAME.slider]: Slider,
  [ELEMENT_NAME.switch]: Switch,
  [ELEMENT_NAME.tabList]: TabList,
  [ELEMENT_NAME.tabPanels]: TabPanels,
  [ELEMENT_NAME.tab]: Item,
  [ELEMENT_NAME.tabs]: Tabs,
  [ELEMENT_NAME.text]: Text,
  [ELEMENT_NAME.textField]: TextField,
  [ELEMENT_NAME.toggleButton]: ToggleButton,
  [ELEMENT_NAME.view]: View,
} as const satisfies Record<ValueOf<ElementName>, unknown>;

export function getComponentTypeForElement<P extends Record<string, unknown>>(
  element: ElementNode<string, P>
): ComponentType<P> | null {
  return (elementComponentMap[
    element[ELEMENT_KEY] as keyof typeof elementComponentMap
  ] ?? null) as ComponentType<P> | null;
}

export function getComponentForElement(element: ElementNode): React.ReactNode {
  const newElement = wrapElementChildren({ ...element });

  if (isHTMLElementNode(newElement)) {
    return HTMLElementView({ element: newElement });
  }
  if (isIconElementNode(newElement)) {
    return IconElementView({ element: newElement });
  }
  if (isElementNode(newElement)) {
    const Component = getComponentTypeForElement(newElement);

    if (Component != null) {
      const props =
        shouldWrapTextChildren.has(newElement[ELEMENT_KEY]) &&
        newElement.props?.children != null
          ? {
              ...newElement.props,
              children: wrapTextChildren(newElement.props.children),
            }
          : newElement.props;

      return <Component {...props} />;
    }
  }

  return newElement.props?.children;
}

/** Data keys of a widget to preserve across re-opening. */
const PRESERVED_DATA_KEYS: (keyof ReadonlyWidgetData)[] = ['panelIds'];
const PRESERVED_DATA_KEYS_SET = new Set<string>(PRESERVED_DATA_KEYS);

/**
 * Returns an object with only the data preserved that should be preserved when re-opening a widget (e.g. opening it again from console).
 * For example, if you re-open a widget, you want to keep the `panelIds` data because that will re-open the widget to where it was before.
 * However, we do _not_ want to preserve the `state` in this case - we want to widget to start from a fresh state.
 * Similar to how when you re-open a table, it'll open in the same spot, but all UI applied filters/operations will be reset.
 * @param oldData The old data to get the preserved data from
 * @returns The data to preserve
 */
export function getPreservedData(
  oldData: ReadonlyWidgetData = {}
): ReadonlyWidgetData {
  return Object.fromEntries(
    Object.entries(oldData).filter(([key]) => PRESERVED_DATA_KEYS_SET.has(key))
  );
}

/**
 * Get the name of an error type
 * @param error Name of an error
 * @returns The name of the error
 */
export function getErrorName(error: unknown): string {
  if (isWidgetError(error)) {
    return error.name;
  }
  return 'Unknown error';
}

/**
 * Get the message of an error
 * @param error Error object
 * @returns The error message
 */
export function getErrorMessage(error: unknown): string {
  if (isWidgetError(error)) {
    return error.message.trim();
  }
  return 'Unknown error';
}

/**
 * Get the short message of an error. Just the first line of the error message.
 * @param error Error object
 * @returns The error short message
 */
export function getErrorShortMessage(error: unknown): string {
  const message = getErrorMessage(error);
  const lines = message.split('\n');
  return lines[0].trim();
}

/**
 * Get the stack trace of an error
 * @param error Error object
 * @returns The error stack trace
 */
export function getErrorStack(error: unknown): string {
  if (isWidgetError(error)) {
    return error.stack ?? '';
  }
  return '';
}

/**
 * Get the action from an error object if it exists
 * @param error Error object
 * @returns The action from the error, if it exists
 */
export function getErrorAction(error: unknown): WidgetAction | null {
  if (isWidgetError(error)) {
    return error.action ?? null;
  }
  return null;
}
