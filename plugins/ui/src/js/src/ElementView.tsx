import React from 'react';
import UIElement, {
  isObjectNode,
  isPrimitiveNode,
  isRenderedNode,
} from './UIElement';
import ObjectView from './ObjectView';
import Widget from './Widget';

export type ElementViewProps = {
  element: UIElement;
};

export function ElementView({ element }: ElementViewProps): JSX.Element | null {
  const { root, objects } = element;
  if (isRenderedNode(root)) {
    const { name, props, children = [] } = root;

    console.log('MJB ElementView', name, props, children);

    return (
      // TODO: Need a way to render this type of component with it's children...
      <>
        {children.map((child, index) => {
          const childElement = { root: child, objects };
          // eslint-disable-next-line react/no-array-index-key
          return <ElementView key={index} element={childElement} />;
        })}
      </>
    );
  }
  if (isObjectNode(root)) {
    const object = objects[root.object_id];
    return <ObjectView object={object as Widget} />;
  }
  if (isPrimitiveNode(root)) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{root}</>;
  }
  throw new Error(`Unknown root type ${root}`);
}

export default ElementView;
