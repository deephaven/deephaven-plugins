import React, { Children, Key, ReactElement, isValidElement } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  Item,
} from '@deephaven/components';
// TODO: #2084 Re-export @react-types/shared types
import { CollectionChildren } from '@react-types/shared';
import { TabProps } from './Tab';

type TabComponentProps = TabsProps<TabProps> & {
  children: CollectionChildren<TabProps>;
  onChange?: (key: Key) => void;
};

function Tabs(props: TabComponentProps): JSX.Element {
  const { children, onSelectionChange, ...otherTabProps } = props;
  const childrenArray = Children.toArray(children);

  if (
    childrenArray.some(
      child =>
        // isValidElement check is necessary to avoid TS error when accessing type of child
        isValidElement(child) &&
        (child.type === TabPanels || child.type === TabList)
    )
  ) {
    return (
      <DHCTabs
        UNSAFE_className="dh-tabs"
        onSelectionChange={onSelectionChange}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...otherTabProps}
      >
        {children}
      </DHCTabs>
    );
  }

  // check for duplicate keys
  const keys = childrenArray.map(child => (child as TabProps).key);
  if (new Set(keys).size !== keys.length) {
    throw new Error('Duplicate keys found in Tab items.');
  }

  const tabChildrenConfig = (isTabList: boolean) => {
    const items = childrenArray.map((child, index) => {
      if (!isValidElement(child)) {
        return null;
      }
      const key =
        child.key ??
        (typeof child.props.title === 'string'
          ? child.props.title
          : `Key-${index}`);
      return (
        <Item key={key}>
          {isTabList ? child.props.title : child.props.children}
        </Item>
      );
    });
    return items;
  };

  // const tabChildrenConfig = (isTabList: boolean) =>
  //   Children.map(
  //     children as ReactElement<TabProps>[],
  //     (child: ReactElement<TabProps>, index: number) => (
  //       <Item
  //         key={
  //           // eslint-disable-next-line no-nested-ternary
  //           child.props.key !== undefined
  //             ? child.props.key
  //             : typeof child.props.title === 'string'
  //             ? child.props.title
  //             : `Key ${index}`
  //         }
  //       >
  //         {isTabList ? child.props.title : child.props.children}
  //       </Item>
  //     )
  //   );

  const tabItems = Children.map(
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

  const tabPanels = Children.map(
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
        {child.props.children}
      </Item>
    )
  );

  return (
    <DHCTabs
      UNSAFE_className="dh-tabs"
      onSelectionChange={onSelectionChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherTabProps}
    >
      <TabList>{tabItems as CollectionChildren<unknown>}</TabList>
      <TabPanels>{tabPanels as CollectionChildren<unknown>}</TabPanels>
    </DHCTabs>
  );
}

Tabs.displayName = 'Tabs';

export default Tabs;
