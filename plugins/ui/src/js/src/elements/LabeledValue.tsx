import {
  LabeledValue as DHCLabeledValue,
  LabeledValueProps as DHCLabeledValueProps,
} from '@deephaven/components';

export function LabeledValue(
  props: DHCLabeledValueProps<number | string[] | string>
): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCLabeledValue {...props} />
  );
}
LabeledValue.displayName = 'LabeledValue';
export default LabeledValue;
