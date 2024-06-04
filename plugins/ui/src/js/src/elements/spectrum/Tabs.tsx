import React, { ReactNode, ReactElement, Children, Key } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  ItemProps,
  TabListProps,
  TabPanelsProps,
  useRenderNormalizedItem,
} from '@deephaven/components';
import { Item, Flex } from '@adobe/react-spectrum';
import { CollectionChildren } from '@react-types/shared';

type TabItemProps = ItemProps<ReactNode> & {
  key: string;
};

type TabComponentProps = TabsProps<TabItemProps> & {
  children: CollectionChildren<TabItemProps>;
  tabListProps?: TabListProps<ReactNode>;
  tabPanelProps?: TabPanelsProps<ReactNode>;
  onChange?: (key: Key) => void;
};

function Tabs(props: TabComponentProps): JSX.Element {
  const { children, tabListProps, tabPanelProps, ...otherTabProps } = props;

  const { onSelectionChange, onChange } = otherTabProps;

  const renderNormalizedItem = useRenderNormalizedItem({
    itemIconSlot: 'icon',
    showItemDescriptions: false,
    showItemIcons: true,
    tooltipOptions: null,
  });

  let tabItems;
  let tabPanels;

  const childrenArray = Children.toArray(children);

  // handle case where no children are passed
  if (childrenArray.length === 0) {
    throw new Error('Tabs must have at least one tab specified.');
  }

  // handle case where children are TabList or TabPanels components
  if (
    childrenArray.some(
      child =>
        (child as ReactElement).type === TabPanels ||
        (child as ReactElement).type === TabList
    )
  ) {
    // handle case where children are TabList or TabPanels components, but tried to pass props in tabListProps or tabPanelProps
    if (tabListProps !== undefined || tabPanelProps !== undefined) {
      throw new Error(
        'Props for the TabList and TabPanels components must be passed within the respective component, not in panel_props and or list_props.'
      );
    } else {
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
  }

  // handle case where children are Item components
  // check for duplicate keys
  const keys = childrenArray.map(child => (child as TabItemProps).key);
  if (new Set(keys).size !== keys.length) {
    throw new Error('Duplicate keys found in Tab items.');
  }

  // eslint-disable-next-line prefer-const
  tabItems = Children.map(
    children as ReactElement<TabItemProps>[],
    (child: ReactElement<TabItemProps>, index) => (
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
    children as ReactElement<TabItemProps>[],
    (child: ReactElement<TabItemProps>, index) => (
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
          {/* {useRenderNormalizedItem(child.props.children)} */}
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
      <TabList {...tabListProps}>{tabItems}</TabList>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TabPanels {...tabPanelProps}>{tabPanels}</TabPanels>
    </DHCTabs>
  );
}

Tabs.displayName = 'Tabs';

export default Tabs;
