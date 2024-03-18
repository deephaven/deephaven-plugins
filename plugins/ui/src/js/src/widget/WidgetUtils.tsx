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
  wrapElementChildren,
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
  const newElement = wrapElementChildren({ ...element });

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
