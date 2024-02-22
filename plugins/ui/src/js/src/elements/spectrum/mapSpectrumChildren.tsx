import { Text } from '@adobe/react-spectrum';
import React from 'react';

/**
 * Map the children of an element to Spectrum children, automatically wrapping strings and numbers in `Text` elements.
 * @param children Children to map as spectrum children
 */
export function mapSpectrumChildren(
  children: React.ReactNode
): React.ReactNode {
  const childrenArray = Array.isArray(children) ? children : [children];
  return childrenArray.map(child => {
    if (typeof child === 'string') {
      return <Text key={child}>{child}</Text>;
    }
    return child;
  });
}

export default mapSpectrumChildren;
