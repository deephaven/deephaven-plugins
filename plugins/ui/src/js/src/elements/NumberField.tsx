import {
  NumberField as DHCNumberField,
  NumberFieldProps as DHCNumberFieldProps,
} from '@deephaven/components';

export function NumberField(props: DHCNumberFieldProps): JSX.Element {
  console.log('NumberField props', props);
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCNumberField {...props} />;
}

NumberField.displayName = 'NumberField';

export default NumberField;
