import {
  Accordion as DHCAccordion,
  AccordionProps as DHCAccordionProps,
} from '@deephaven/components';
import { useConditionalCallback } from './hooks';

export function Accordion(
  props: DHCAccordionProps & {
    onExpandedChange?: (expandedKeys: React.Key[]) => void;
  }
): JSX.Element {
  const {
    expandedKeys,
    onExpandedChange: propOnExpandedChange,
    ...otherProps
  } = props;

  const onExpandedChange = useConditionalCallback(
    propOnExpandedChange != null,
    (e: Set<React.Key>) => propOnExpandedChange?.(Array.from(e)),
    [propOnExpandedChange]
  );

  return (
    <DHCAccordion
      onExpandedChange={onExpandedChange}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...otherProps}
    />
  );
}

export default Accordion;
