import React from 'react';
import { isElementNode, isExportedObject } from './ElementUtils';
import ElementView from './ElementView';
import ObjectView from './ObjectView';

/**
 * Function to render children of an element
 */
function renderElementChildren(children: React.ReactNode): JSX.Element {
  console.log('MJB renderElementChildren wtf?', children);
  if (children == null) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  }

  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, i) => {
          if (isElementNode(child)) {
            console.log('MJB renderElementChildren children element', child);
            return <ElementView element={child} key={i} />;
          }
          if (isExportedObject(child)) {
            console.log(
              'MJB renderElementChildren children exportedObj',
              child
            );
            return <ObjectView object={child} key={i} />;
          }

          if (React.isValidElement(child)) {
            console.log('MJB renderElementChildren isValid', child);
            return React.cloneElement(child, { key: i });
          }

          console.log('MJB renderElementChildren just rendering', child);
          return child;
        })}
      </>
    );
  }

  if (isElementNode(children)) {
    console.log('MJB renderElementChildren render child element', children);
    return <ElementView element={children} />;
  }

  if (isExportedObject(children)) {
    console.log('MJB renderElementChildren render exported obj', children);
    return <ObjectView object={children} />;
  }

  console.log('MJB renderElementChildren fallback rendering', child);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default renderElementChildren;
