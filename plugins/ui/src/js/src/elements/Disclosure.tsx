import {
  Disclosure as DHCDisclosure,
  DisclosureProps as DHCDisclosureProps,
  DisclosureTitle as DHCDisclosureTitle,
  DisclosurePanel as DHCDisclosurePanel,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';
import { ReactNode } from 'react';

export type SerializedDisclosureProps = Omit<DHCDisclosureProps, 'children'> & {
  title: ReactNode;
  panel: ReactNode;
};

export function Disclosure(props: SerializedDisclosureProps): JSX.Element {
  const { title, panel, ...otherProps } = props;
  return (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <DHCDisclosure {...otherProps}>
      {title != null &&
        (isElementOfType(title, DHCDisclosureTitle) ? (
          title
        ) : (
          <DHCDisclosureTitle>{title}</DHCDisclosureTitle>
        ))}
      {panel != null &&
        (isElementOfType(panel, DHCDisclosurePanel) ? (
          panel
        ) : (
          <DHCDisclosurePanel>{panel}</DHCDisclosurePanel>
        ))}
    </DHCDisclosure>
  );
}

export default Disclosure;
