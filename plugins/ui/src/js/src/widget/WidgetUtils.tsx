/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/prefer-default-export */
import React, { ComponentType } from 'react';
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

export function getComponentForElement(element: ElementNode): React.ReactNode {
  // Need to convert the children of the element if they are exported objects to an ObjectView
  // Else React won't be able to render them
  const newElement = { ...element };
  if (newElement.props?.children != null) {
    const { children } = newElement.props;
    if (Array.isArray(children)) {
      const typeMap = new Map<string, number>();
      newElement.props.children = children.map((child, i) => {
        if (isExportedObject(child)) {
          const { type } = child;
          const typeCount = typeMap.get(type) ?? 0;
          typeMap.set(type, typeCount + 1);
          const key = `${type}-${typeCount}`;
          return <ObjectView key={key} object={child} />;
        }
        return child;
      });
    } else if (isExportedObject(children)) {
      newElement.props.children = <ObjectView object={children} />;
    }
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
