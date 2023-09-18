import React from 'react';
import UIElement, {
  isObjectNode,
  isPrimitiveNode,
  isRenderedNode,
} from './UIElement';
import ObjectView from './ObjectView';
import { isHTMLElementNode } from './UIHTMLElement';

export type ElementViewProps = {
  element: UIElement;
};

export function ElementView({ element }: ElementViewProps): JSX.Element | null {
  const { root, objects } = element;

  if (isRenderedNode(root)) {
    const { children = [] } = root;
    const inner = children.map((child, index) => {
      const childElement = { root: child, objects };
      // eslint-disable-next-line react/no-array-index-key
      return <ElementView key={index} element={childElement} />;
    });
    if (isHTMLElementNode(root)) {
      const { props } = root;
      // eslint-disable-next-line react/prop-types
      const { tag: Tag, attributes } = props;
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Tag {...attributes}>{inner}</Tag>;
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{inner}</>;
  }
  if (isObjectNode(root)) {
    const object = objects[root.object_id];
    return <ObjectView object={object} />;
  }
  if (isPrimitiveNode(root)) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{root}</>;
  }
  throw new Error(`Unknown root type ${root}`);
}

export default ElementView;
