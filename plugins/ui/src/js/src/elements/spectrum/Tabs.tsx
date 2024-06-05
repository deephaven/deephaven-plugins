import React, { ReactElement, Children, Key } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  Item,
  Flex,
} from '@deephaven/components';
import { CollectionChildren } from '@react-types/shared';
import { TabProps } from './Tab';

type TabComponentProps = TabsProps<TabProps> & {
  children: CollectionChildren<TabProps>;
  onChange?: (key: Key) => void;
};

// NEED TO CLARIFY MISMATCHING KEYS -> CURRENTLY DOES NOT RAISE ERROR
// NEED TO CLARIFY HOW TO HAVE ERROR RAISE IN CONSOLE

function Tabs(props: TabComponentProps): JSX.Element {
  const { children, ...otherTabProps } = props;

  const { onSelectionChange, onChange } = otherTabProps;

  let tabItems;
  let tabPanels;

  const childrenArray = Children.toArray(children);

  let hasTabChild = false;
  let hasTabPanelsOrTabListChild = false;

  childrenArray.forEach(child => {
    if ((child as ReactElement).type === Item) {
      hasTabChild = true;
    }
    if (
      (child as ReactElement).type === TabPanels ||
      (child as ReactElement).type === TabList
    ) {
      hasTabPanelsOrTabListChild = true;
    }
  });

  if (hasTabChild && hasTabPanelsOrTabListChild) {
    throw new Error(
      'Tabs cannot have both Tab and TabPanels or TabList children.'
    );
  } else if (!hasTabChild && !hasTabPanelsOrTabListChild) {
    throw new Error(
      'Tabs must have at least one Tab or TabPanels or TabList child.'
    );
  } else if (hasTabPanelsOrTabListChild) {
    return (
      <DHCTabs
        UNSAFE_style={{
          display: 'flex',
          flexGrow: 1,
          height: '100%',
          width: '100%',
        }}
        onSelectionChange={onSelectionChange ?? onChange}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...otherTabProps}
      >
        {children}
      </DHCTabs>
    );
  }

  // handle case where children are Item components
  // check for duplicate keys
  const keys = childrenArray.map(child => (child as TabProps).key);
  if (new Set(keys).size !== keys.length) {
    throw new Error('Duplicate keys found in Tab items.');
  }

  // eslint-disable-next-line prefer-const
  tabItems = Children.map(
    children as ReactElement<TabProps>[],
    (child: ReactElement<TabProps>, index) => (
      <Item
        key={
          // eslint-disable-next-line no-nested-ternary
          child.props.key !== undefined
            ? child.props.key
            : typeof child.props.title === 'string'
            ? child.props.title
            : `Key ${index}`
        }
      >
        {child.props.title}
      </Item>
    )
  );

  // eslint-disable-next-line prefer-const
  tabPanels = Children.map(
    children as ReactElement<TabProps>[],
    (child: ReactElement<TabProps>, index) => (
      <Item
        key={
          // eslint-disable-next-line no-nested-ternary
          child.props.key !== undefined
            ? child.props.key
            : typeof child.props.title === 'string'
            ? child.props.title
            : `Key ${index}`
        }
      >
        <Flex height="100%" width="100%" flexGrow={1}>
          {child.props.children}
        </Flex>
      </Item>
    )
  );

  return (
    <DHCTabs
      UNSAFE_style={{
        display: 'flex',
        flexGrow: 1,
        height: '100%',
        width: '100%',
      }}
      onSelectionChange={onSelectionChange ?? onChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherTabProps}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TabList>{tabItems}</TabList>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TabPanels>{tabPanels}</TabPanels>
    </DHCTabs>
  );
}

Tabs.displayName = 'Tabs';

export default Tabs;
