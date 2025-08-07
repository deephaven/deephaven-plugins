/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/prefer-default-export */
import React, { ComponentType } from 'react';
import type { JSONRPCServerAndClient } from 'json-rpc-2.0';
// Importing `Item` and `Section` components directly since they should not be
// wrapped due to how Spectrum collection components consume them.
import {
  ActionMenu,
  Avatar,
  Breadcrumbs,
  ButtonGroup,
  SpectrumCheckbox as Checkbox,
  CheckboxGroup,
  Content,
  ContextualHelpTrigger,
  DialogTrigger,
  DisclosureTitle,
  DisclosurePanel,
  Divider,
  Footer,
  Heading,
  Item,
  Link,
  ListActionGroup,
  ListActionMenu,
  MenuTrigger,
  NumberField,
  Section,
  Switch,
  TabList,
  Text,
  SubmenuTrigger,
  View,
} from '@deephaven/components';
import { ValueOf, EMPTY_MAP } from '@deephaven/utils';
import Log from '@deephaven/log';
import type { ElementMap } from '@deephaven/plugin';
import { ReadonlyWidgetData } from './WidgetTypes';
import {
  ElementNode,
  ELEMENT_KEY,
  isElementNode,
  wrapElementChildren,
  isCallableNode,
  CALLABLE_KEY,
  wrapTextChildren,
  isPrimitive,
  getElementKey,
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
  Accordion,
  ActionButton,
  ActionGroup,
  Badge,
  Button,
  Calendar,
  ColorEditor,
  ColorPicker,
  ComboBox,
  ContextualHelp,
  DateField,
  DatePicker,
  DateRangePicker,
  Dialog,
  Disclosure,
  Flex,
  Form,
  Grid,
  IllustratedMessage,
  Image,
  LabeledValue,
  InlineAlert,
  ListView,
  LogicButton,
  Markdown,
  Menu,
  Meter,
  Picker,
  ProgressBar,
  ProgressCircle,
  Radio,
  RadioGroup,
  RangeCalendar,
  RangeSlider,
  SearchField,
  Slider,
  TabPanels,
  TagGroup,
  TextField,
  TextArea,
  TimeField,
  ToggleButton,
  UITable,
  Tabs,
} from '../elements';
import UriObjectView from '../elements/UriObjectView';

export const WIDGET_ELEMENT = 'deephaven.ui.Element';
export const DASHBOARD_ELEMENT = 'deephaven.ui.Dashboard';

/**
 * Elements to implicitly wrap primitive children in <Text> components.
 */
const shouldWrapTextChildren = new Set<string>([
  ELEMENT_NAME.column,
  ELEMENT_NAME.flex,
  ELEMENT_NAME.grid,
  ELEMENT_NAME.view,
]);

const log = Log.module('@deephaven/js-plugin-ui/WidgetUtils');

/*
 * Map element node names to their corresponding React components
 */
export const elementComponentMap: Record<ValueOf<ElementName>, unknown> = {
  // Elements
  [ELEMENT_NAME.uiTable]: UITable,
  [ELEMENT_NAME.uri]: UriObjectView,

  // Layout
  [ELEMENT_NAME.column]: Column,
  [ELEMENT_NAME.dashboard]: Dashboard,
  [ELEMENT_NAME.panel]: ReactPanel,
  [ELEMENT_NAME.row]: Row,
  [ELEMENT_NAME.stack]: Stack,

  // Other components
  [ELEMENT_NAME.accordion]: Accordion,
  [ELEMENT_NAME.actionButton]: ActionButton,
  [ELEMENT_NAME.actionGroup]: ActionGroup,
  [ELEMENT_NAME.actionMenu]: ActionMenu,
  [ELEMENT_NAME.avatar]: Avatar,
  [ELEMENT_NAME.badge]: Badge,
  [ELEMENT_NAME.breadcrumbs]: Breadcrumbs,
  [ELEMENT_NAME.button]: Button,
  [ELEMENT_NAME.buttonGroup]: ButtonGroup,
  [ELEMENT_NAME.calendar]: Calendar,
  [ELEMENT_NAME.checkbox]: Checkbox,
  [ELEMENT_NAME.checkboxGroup]: CheckboxGroup,
  [ELEMENT_NAME.colorEditor]: ColorEditor,
  [ELEMENT_NAME.colorPicker]: ColorPicker,
  [ELEMENT_NAME.comboBox]: ComboBox,
  [ELEMENT_NAME.content]: Content,
  [ELEMENT_NAME.contextualHelp]: ContextualHelp,
  [ELEMENT_NAME.contextualHelpTrigger]: ContextualHelpTrigger,
  [ELEMENT_NAME.dateField]: DateField,
  [ELEMENT_NAME.datePicker]: DatePicker,
  [ELEMENT_NAME.dateRangePicker]: DateRangePicker,
  [ELEMENT_NAME.dialog]: Dialog,
  [ELEMENT_NAME.dialogTrigger]: DialogTrigger,
  [ELEMENT_NAME.disclosure]: Disclosure,
  [ELEMENT_NAME.disclosureTitle]: DisclosureTitle,
  [ELEMENT_NAME.disclosurePanel]: DisclosurePanel,
  [ELEMENT_NAME.divider]: Divider,
  [ELEMENT_NAME.flex]: Flex,
  [ELEMENT_NAME.form]: Form,
  [ELEMENT_NAME.footer]: Footer,
  [ELEMENT_NAME.fragment]: React.Fragment,
  [ELEMENT_NAME.grid]: Grid,
  [ELEMENT_NAME.heading]: Heading,
  [ELEMENT_NAME.illustratedMessage]: IllustratedMessage,
  [ELEMENT_NAME.image]: Image,
  [ELEMENT_NAME.inlineAlert]: InlineAlert,
  [ELEMENT_NAME.item]: Item,
  [ELEMENT_NAME.labeledValue]: LabeledValue,
  [ELEMENT_NAME.link]: Link,
  [ELEMENT_NAME.listActionGroup]: ListActionGroup,
  [ELEMENT_NAME.listActionMenu]: ListActionMenu,
  [ELEMENT_NAME.listView]: ListView,
  [ELEMENT_NAME.logicButton]: LogicButton,
  [ELEMENT_NAME.markdown]: Markdown,
  [ELEMENT_NAME.menu]: Menu,
  [ELEMENT_NAME.menuTrigger]: MenuTrigger,
  [ELEMENT_NAME.meter]: Meter,
  [ELEMENT_NAME.numberField]: NumberField,
  [ELEMENT_NAME.picker]: Picker,
  [ELEMENT_NAME.progressBar]: ProgressBar,
  [ELEMENT_NAME.progressCircle]: ProgressCircle,
  [ELEMENT_NAME.radio]: Radio,
  [ELEMENT_NAME.radioGroup]: RadioGroup,
  [ELEMENT_NAME.rangeCalendar]: RangeCalendar,
  [ELEMENT_NAME.rangeSlider]: RangeSlider,
  [ELEMENT_NAME.searchField]: SearchField,
  [ELEMENT_NAME.section]: Section,
  [ELEMENT_NAME.slider]: Slider,
  [ELEMENT_NAME.submenuTrigger]: SubmenuTrigger,
  [ELEMENT_NAME.switch]: Switch,
  [ELEMENT_NAME.tabList]: TabList,
  [ELEMENT_NAME.tabPanels]: TabPanels,
  [ELEMENT_NAME.tab]: Item,
  [ELEMENT_NAME.tabs]: Tabs,
  [ELEMENT_NAME.tagGroup]: TagGroup,
  [ELEMENT_NAME.text]: Text,
  [ELEMENT_NAME.textArea]: TextArea,
  [ELEMENT_NAME.textField]: TextField,
  [ELEMENT_NAME.timeField]: TimeField,
  [ELEMENT_NAME.toggleButton]: ToggleButton,
  [ELEMENT_NAME.view]: View,
} as const satisfies Record<ValueOf<ElementName>, unknown>;

export function getComponentTypeForElement<
  P extends Record<string, unknown> | undefined,
>(
  element: ElementNode<string, P>,
  elementMap: ElementMap = EMPTY_MAP
): ComponentType<P> | null {
  const key = element[ELEMENT_KEY];
  if (elementMap.has(key)) {
    return elementMap.get(key) as ComponentType<P> | null;
  }
  return (elementComponentMap[
    element[ELEMENT_KEY] as keyof typeof elementComponentMap
  ] ?? null) as ComponentType<P> | null;
}

export function getComponentForElement(
  element: ElementNode,
  elementMap: ElementMap = EMPTY_MAP
): JSX.Element | null {
  const newElement = wrapElementChildren({ ...element });

  if (isHTMLElementNode(newElement)) {
    return HTMLElementView({ element: newElement });
  }
  if (isIconElementNode(newElement)) {
    return IconElementView({ element: newElement });
  }
  if (isElementNode(newElement)) {
    const Component = getComponentTypeForElement(newElement, elementMap);

    if (Component != null) {
      const props = { ...newElement.props };
      if (
        shouldWrapTextChildren.has(newElement[ELEMENT_KEY]) &&
        props?.children != null
      ) {
        props.children = wrapTextChildren(props.children);
      }
      if (props?.contextualHelp != null && isPrimitive(props.contextualHelp)) {
        props.contextualHelp = (
          <ContextualHelp heading={null} content={props.contextualHelp} />
        );
      }
      return <Component {...props} />;
    }
  }

  return newElement.props?.children as JSX.Element | null;
}

/**
 * Deeply transform a given object depth-first and return a new object given a transform function.
 * Useful for iterating through an object and converting values.
 * Also adds __dhId prop to any element nodes to uniquely identify them.
 *
 * @param value The object to transform.
 * @param transform Function to be called for each key-value pair in the object, allowing for the value to be transformed.
 * @param id The dhId of the current object. Used as a unique ID for elements.
 * @param key The key of the current object.
 * @returns A new object with the same keys as the original object, but with the values replaced by the return value of the callback. If there were no changes, returns the same object.
 */
export function transformNode(
  value: unknown,
  transform: (key: string, value: unknown) => unknown,
  id: string,
  key = ''
): unknown {
  // We initialize the result to the same value, but if any of the children values change, we'll shallow copy it
  let result = value;

  let nextId = id;

  // The component names will be added instead of props/children
  if (key === 'children' && id.endsWith('/props')) {
    nextId = nextId.slice(0, -1 * '/props'.length);
  }

  if (isElementNode(result)) {
    // Don't fallback to key if it's children, only fallback should be an array or object index
    const elementKey = getElementKey(result, key === 'children' ? '' : key);
    nextId += `/${result[ELEMENT_KEY]}${elementKey ? `:${elementKey}` : ''}`;
    result = { ...result, props: { ...result.props, __dhId: nextId } };
  } else if (key !== 'children') {
    // We have already removed trailing /props if we are at /props/children, so don't add /children
    // The next item (children) must be either a child element or an array of children
    nextId += `/${key}`;
  }

  // First check if it's an object or an array - if it is then we need to encode the children first
  if (Array.isArray(result)) {
    let arrayResult: unknown[] = result;
    arrayResult.forEach((childValue, i) => {
      const newChildValue = transformNode(
        childValue,
        transform,
        nextId,
        `${i}`
      );
      if (newChildValue !== childValue) {
        if (arrayResult === value) {
          arrayResult = [...arrayResult];
        }
        arrayResult[i] = newChildValue;
      }
    });
    result = arrayResult;
  } else if (typeof result === 'object' && result != null) {
    let objResult = result as Record<string, unknown>;
    Object.entries(result).forEach(([childKey, childValue]) => {
      const newChildValue = transformNode(
        childValue,
        transform,
        nextId,
        childKey
      );
      if (newChildValue !== childValue) {
        if (objResult === value) {
          objResult = { ...objResult };
        }
        objResult[childKey] = newChildValue;
      }
    });
    result = objResult;
  }

  // Finally we encode the object we were passed in
  return transform(key, result);
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
 * Wraps a callable returned by the server so any returned callables are also wrapped.
 * The callable will also be added to the finalization registry so it can be cleaned up
 * when there are no more strong references to the callable.
 * @param jsonClient The JSON client to send callable requests to
 * @param callableId The callableId to return a wrapped callable for
 * @param registry The finalization registry to register the callable with.
 * @param shouldRegister Whether to register the callable in the finalization registry
 * @returns A wrapped callable that will automatically wrap any nested callables returned by the server
 */
export function wrapCallable(
  jsonClient: JSONRPCServerAndClient,
  callableId: string,
  registry: FinalizationRegistry<string>,
  shouldRegister = true
): (...args: unknown[]) => Promise<unknown> {
  const callable = async (...args: unknown[]) => {
    log.debug2(`Callable ${callableId} called`, args);
    const resultString = await jsonClient.request('callCallable', [
      callableId,
      args,
    ]);

    log.debug2(`Callable ${callableId} result string`, resultString);

    try {
      // Do NOT add anything that logs result
      // It creates a strong ref to the result object in the console logs
      // As a result, any returned callables will never be GC'd and the finalization registry will never clean them up
      const result = JSON.parse(resultString, (key, value) => {
        if (isCallableNode(value)) {
          const nestedCallable = wrapCallable(
            jsonClient,
            value[CALLABLE_KEY],
            registry
          );
          return nestedCallable;
        }
        return value;
      });

      return result;
    } catch {
      throw new Error(`Error parsing callable result: ${resultString}`);
    }
  };

  if (shouldRegister) {
    registry.register(callable, callableId, callable);
  }

  return callable;
}
