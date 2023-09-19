import React from 'react';
import { Flex } from '@adobe/react-spectrum';
import UIElement, {
  isObjectNode,
  isPrimitiveNode,
  isRenderedNode,
} from './UIElement';
import ObjectView from './ObjectView';
import { getHTMLTag, isHTMLElementNode } from './UIHTMLElement';

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
      const { name, props } = root;
      const Tag = getHTMLTag(name);
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Tag {...props}>{inner}</Tag>;
    }
    switch (root.name) {
      case 'deephaven.ui.spectrum.Flex':
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Flex {...(root.props ?? {})}>{inner}</Flex>;
      default:
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{inner}</>;
    }
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
