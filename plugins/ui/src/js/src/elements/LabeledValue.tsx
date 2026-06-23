import {
  LabeledValue as DHCLabeledValue,
  type LabeledValueProps as DHCLabeledValueProps,
} from '@deephaven/components';
import { type RangeValue } from './hooks';
import {
  type SerializedLabeledValueProps,
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
