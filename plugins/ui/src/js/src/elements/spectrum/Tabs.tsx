import React, { ReactNode } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  ItemProps,
  TabListProps,
  TabPanelsProps,
} from '@deephaven/components';
import { Item, Flex } from '@adobe/react-spectrum';
import { CollectionChildren, Node } from '@react-types/shared';

type TabItemProps = ItemProps<ReactNode> & {
  key: string;
  title: string;
};

type TabComponentProps = TabsProps<TabItemProps> & {
  children: CollectionChildren<TabItemProps>;
  tabListProps?: TabListProps<ReactNode>;
  tabPanelProps?: TabPanelsProps<ReactNode>;
};

function Tabs(props: TabComponentProps): JSX.Element {
  const { children, tabListProps, tabPanelProps, ...otherTabProps } = props;

  // NEED TO CLARIFY: Issues with children type

  // const tabItems = React.Children.map(
  //   children,
  //   (child: React.ReactElement<SectionProps<ItemProps<ReactNode>>>, index) => (
  //     <Item key={child.props.key || index} textValue={child.props.title as string}>
  //       {child.props.title}
  //     </Item>
  //   )
  // );

  // NEED TO CLARIFY: Issues with children type=

  // const tabPanels = React.Children.map(
  //   children,
  //   (child: React.ReactElement<SectionProps<ItemProps<ReactNode>>>, index) => (
  //     <Item key={child.props.key || index}>
  //       <Flex direction="column" height="100%" width="100%" flexGrow={1}>
  //         {child.props.children}
  //       </Flex>
  //     </Item>
  //   )
  // );

  return (
    <DHCTabs
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherTabProps}
    >
      <TabList
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...tabListProps}
      >
        {children}
        {/* NEED TO FIX */}
        {/* {tabItems as CollectionChildren<TabItemProps>} */}
      </TabList>
      <TabPanels
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...tabPanelProps}
      >
        {children}
        {/* NEED TO FIX */}
        {/* {tabPanels as CollectionChildren<TabItemProps>} */}
      </TabPanels>
    </DHCTabs>
  );
}

Tabs.displayName = 'Tabs';

export default Tabs;
