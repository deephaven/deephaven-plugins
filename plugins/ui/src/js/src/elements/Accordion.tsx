import {
  Accordion as DHCAccordion,
  AccordionProps as DHCAccordionProps,
} from '@deephaven/components';

export function Accordion(props: DHCAccordionProps): JSX.Element {
  const { children, ...otherProps } = props;
  /* eslint-disable-next-line react/jsx-props-no-spreading */
  return <DHCAccordion {...props} />;
}

export default Accordion;
