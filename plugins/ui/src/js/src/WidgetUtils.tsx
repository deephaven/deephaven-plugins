/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import {
  ElementNode,
  isExportedObject,
  isFragmentElementNode,
} from './ElementUtils';
import HTMLElementView from './HTMLElementView';
import { isHTMLElementNode } from './HTMLElementUtils';
import { isSpectrumElementNode } from './SpectrumElementUtils';
import SpectrumElementView from './SpectrumElementView';
import { isIconElementNode } from './IconElementUtils';
import IconElementView from './IconElementView';
import { isUITable } from './UITableUtils';
import UITable from './UITable';
import {
  isColumnElementNode,
  isDashboardElementNode,
  isPanelElementNode,
  isRowElementNode,
  isStackElementNode,
} from './layout/LayoutUtils';
import ReactPanel from './ReactPanel';
import ObjectView from './ObjectView';
import Row from './layout/Row';
import Stack from './layout/Stack';
import Column from './layout/Column';
import Dashboard from './layout/Dashboard';

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
  if (isUITable(newElement)) {
    return <UITable {...newElement.props} />;
  }
  if (isPanelElementNode(newElement)) {
    return <ReactPanel {...newElement.props} />;
  }
  if (isFragmentElementNode(newElement)) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{newElement.props?.children}</>;
  }
  if (isRowElementNode(newElement)) {
    return <Row {...newElement.props} />;
  }
  if (isColumnElementNode(newElement)) {
    return <Column {...newElement.props} />;
  }
  if (isStackElementNode(newElement)) {
    return <Stack {...newElement.props} />;
  }
  if (isDashboardElementNode(newElement)) {
    return <Dashboard {...newElement.props} />;
  }

  return newElement.props?.children;
}
