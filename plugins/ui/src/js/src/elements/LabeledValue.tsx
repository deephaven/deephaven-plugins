import {
  LabeledValue as DHCLabeledValue,
  LabeledValueProps as DHCLabeledValueProps,
} from '@deephaven/components';
import { RangeValue } from './hooks';
import {
  SerializedLabeledValueProps,
  useLabeledValueProps,
} from './hooks/useLabeledValueProps';

export function LabeledValue(
  props: SerializedLabeledValueProps<
    DHCLabeledValueProps<number | string | string[] | RangeValue<number>>
  >
): JSX.Element {
  const labeledValueProps = useLabeledValueProps(props);

  return (
    <DHCLabeledValue
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...labeledValueProps}
    />
  );
}

LabeledValue.displayName = 'LabeledValue';

export default LabeledValue;
