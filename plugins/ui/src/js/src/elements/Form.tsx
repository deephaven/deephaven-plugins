import {
  Form as DHCForm,
  FormProps as DHCFormProps,
} from '@deephaven/components';
import { useFormEventCallback } from './hooks/useFormEventCallback';

export function Form(
  props: DHCFormProps & {
    onSubmit?: (data: { [key: string]: FormDataEntryValue }) => void;
    onReset?: (data: { [key: string]: FormDataEntryValue }) => void;
    onInvalid?: (data: { [key: string]: FormDataEntryValue }) => void;
  }
): JSX.Element {
  const {
    onSubmit: propOnSubmit,
    onReset: propOnReset,
    onInvalid: propOnInvalid,
    ...otherProps
  } = props;

  const onSubmit = useFormEventCallback(propOnSubmit);
  const onReset = useFormEventCallback(propOnReset);
  const onInvalid = useFormEventCallback(propOnInvalid);

  return (
    <DHCForm
      onSubmit={onSubmit}
      onReset={onReset}
      onInvalid={onInvalid}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

Form.displayName = 'Form';

export default Form;
