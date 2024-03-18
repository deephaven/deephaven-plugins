/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/prefer-default-export */
import React, { ComponentType } from 'react';
import { Text } from '@adobe/react-spectrum';
// Importing `Item` and `Section` compnents directly since they should not be
// wrapped due to how Spectrum collection components consume them.
import { Item, Section } from '@deephaven/components';
import {
  ElementNode,
  ELEMENT_KEY,
  isElementNode,
  isExportedObject,
} from '../elements/ElementUtils';
import HTMLElementView from '../elements/HTMLElementView';
import { isHTMLElementNode } from '../elements/HTMLElementUtils';
import { isSpectrumElementNode } from '../elements/SpectrumElementUtils';
import SpectrumElementView from '../elements/SpectrumElementView';
import { isIconElementNode } from '../elements/IconElementUtils';
import IconElementView from '../elements/IconElementView';
import UITable from '../elements/UITable';
import {
  COLUMN_ELEMENT_NAME,
  DASHBOARD_ELEMENT_NAME,
  FRAGMENT_ELEMENT_NAME,
  ITEM_ELEMENT_NAME,
  PANEL_ELEMENT_NAME,
  PICKER_ELEMENT_NAME,
  ROW_ELEMENT_NAME,
  SECTION_ELEMENT_NAME,
  STACK_ELEMENT_NAME,
  UITABLE_ELEMENT_TYPE,
} from '../elements/ElementConstants';
import ReactPanel from '../layout/ReactPanel';
import ObjectView from '../elements/ObjectView';
import Row from '../layout/Row';
import Stack from '../layout/Stack';
import Column from '../layout/Column';
import Dashboard from '../layout/Dashboard';
import Picker from '../elements/Picker';
import { WidgetExportedObject } from '@deephaven/jsapi-types';

/*
 * Map element node names to their corresponding React components
 */
export const elementComponentMap = {
  [PANEL_ELEMENT_NAME]: ReactPanel,
  [ROW_ELEMENT_NAME]: Row,
  [COLUMN_ELEMENT_NAME]: Column,
  [FRAGMENT_ELEMENT_NAME]: React.Fragment,
  [STACK_ELEMENT_NAME]: Stack,
  [DASHBOARD_ELEMENT_NAME]: Dashboard,
  [ITEM_ELEMENT_NAME]: Item,
  [PICKER_ELEMENT_NAME]: Picker,
  [SECTION_ELEMENT_NAME]: Section,
  [UITABLE_ELEMENT_TYPE]: UITable,
} as const;

export function getComponentTypeForElement<P extends Record<string, unknown>>(
  element: ElementNode<string, P>
): ComponentType<P> | null {
  return (elementComponentMap[
    element[ELEMENT_KEY] as keyof typeof elementComponentMap
  ] ?? null) as ComponentType<P> | null;
}

export function isPrimitive(
  value: unknown
): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function getComponentForElement(element: ElementNode): React.ReactNode {
  const newElement = { ...element };

  if (newElement.props?.children != null) {
    const isItemElement = isElementNode(newElement, ITEM_ELEMENT_NAME);

    // We will be wrapping all primitive `Item` children in a `Text` element to
    // ensure proper layout. Since `Item` components require a `textValue` prop
    // if they don't contain exactly 1 `string` child, this will trigger a11y
    // warnings. We can set a default `textValue` prop in cases where the
    // original had a single primitive child.
    if (
      isItemElement &&
      !('textValue' in newElement.props) &&
      isPrimitive(newElement.props.children)
    ) {
      newElement.props.textValue = newElement.props.children;
    }

    // Derive child keys based on type + index of the occurrence of the type
    const typeMap = new Map<string, number>();
    const getChildKey = (type: string): string => {
      const typeCount = typeMap.get(type) ?? 0;
      typeMap.set(type, typeCount + 1);
      return `${type}-${typeCount}`;
    };

    const children = Array.isArray(newElement.props.children)
      ? newElement.props.children
      : [newElement.props.children];

    const wrappedChildren = children.map(child => {
      // Exported objects need to be converted to `ObjectView` to be rendered
      if (isExportedObject(child)) {
        const { type } = child;
        return <ObjectView key={getChildKey(type)} object={child} />;
      }

      // Auto wrap primitive children of `Item` elements in `Text` elements
      if (isItemElement && isPrimitive(child)) {
        return <Text key={String(child)}>{child}</Text>;
      }

      return child;
    });

    // Keep the children as an array or single item based on the original value
    newElement.props.children = Array.isArray(newElement.props.children)
      ? wrappedChildren
      : wrappedChildren[0];
  }

  if (isHTMLElementNode(newElement)) {
    return HTMLElementView({ element: newElement });
  }
  if (isSpectrumElementNode(newElement)) {
    return SpectrumElementView({ element: newElement });
  }
  if (isIconElementNode(newElement)) {
    return IconElementView({ element: newElement });
  }
  if (isElementNode(newElement)) {
    const Component = getComponentTypeForElement(newElement);

    if (Component != null) {
      return <Component {...newElement.props} />;
    }
  }

  return newElement.props?.children;
}
