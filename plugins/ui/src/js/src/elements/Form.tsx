import React, { useCallback } from 'react';
import {
  Form as DHCForm,
  FormProps as DHCFormProps,
} from '@deephaven/components';

export function Form(
  props: DHCFormProps & {
    onSubmit?: (data: { [key: string]: FormDataEntryValue }) => void;
  }
): JSX.Element {
  const { onSubmit: propOnSubmit, ...otherProps } = props;

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      // We never want the page to refresh, prevent submitting the form
      e.preventDefault();

      // Return the data to the server
      const data = Object.fromEntries(new FormData(e.currentTarget));
      propOnSubmit?.(data);
    },
    [propOnSubmit]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCForm onSubmit={onSubmit} {...otherProps} />
  );
}

Form.displayName = 'Form';

export default Form;
