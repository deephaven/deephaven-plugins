import React from 'react';
import {
  FlexProps,
  Item,
  TabPanels as SpectrumTabPanels,
  SpectrumTabPanelsProps,
} from '@adobe/react-spectrum';
import Flex from './Flex';

function isFlexComponent(
  item: JSX.Element
): item is React.ReactElement<FlexProps> {
  return React.isValidElement(item) && item.type === Flex;
}

function isItemComponent(item: JSX.Element): boolean {
  return React.isValidElement(item) && item.type === Item;
}

/**
 * Normalizes the children of the TabsPanel component, returning an array of children.
 * If there's only one child and it's a flex component, it will set `height=100%` on it if no height is already set.
 * Otherwise it does not fill the space, and that's almost certainly not what the user wants.
 * @param item Item to normalize
 * @returns The normalized children
 */
function mapTabPanelsItemChild(item: JSX.Element): JSX.Element {
  if (isFlexComponent(item)) {
    const { props } = item;
    return React.cloneElement(item, {
      height: '100%',
      ...props,
    });
  }
  return item;
}

function mapTabPanelsChild(child: JSX.Element): JSX.Element {
  if (isItemComponent(child)) {
    const { props } = child;
    const { children } = props;
    return React.cloneElement(child, {
      ...props,
      children: Array.isArray(children)
        ? children.map(mapTabPanelsItemChild)
        : mapTabPanelsItemChild(children),
    });
  }
  return child;
}

/**
 * Normalizes the children of the TabsPanel component, returning an array of children.
 * If there's only one child and it's a flex component, it will set `height=100%` on it if no height is already set.
 * Otherwise it does not fill the space, and that's almost certainly not what the user wants.
 * @param children Children to normalize
 * @returns The normalized children
 */
function mapTabPanelsChildren(children: React.ReactNode): JSX.Element[] {
  const childrenArray = Array.isArray(children) ? children : [children];
  return childrenArray.map(mapTabPanelsChild);
}

function TabPanels(props: SpectrumTabPanelsProps<React.ReactNode>) {
  const { children, ...otherProps } = props;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumTabPanels {...otherProps}>
      {mapTabPanelsChildren(children)}
    </SpectrumTabPanels>
  );
}

TabPanels.displayName = 'TabPanels';

export default TabPanels;
