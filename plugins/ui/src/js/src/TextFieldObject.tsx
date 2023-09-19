import React, { useCallback, useEffect, useState } from 'react';
import { TextField } from '@adobe/react-spectrum';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import Log from '@deephaven/log';
import TextFieldWidget from './TextFieldWidget';

const log = Log.module('@deephaven/js-plugin-ui/TextFieldObject');

const VALUE_CHANGE_DEBOUNCE = 250;

export interface TextFieldObjectProps {
  object: TextFieldWidget;
}

function TextFieldObject(props: TextFieldObjectProps) {
  const { object } = props;
  const dh = useApi();

  const [value, setValue] = useState(atob(object.getDataAsBase64()));

  const sendMessage = useCallback(
    sendValue => {
      log.info('Sending message', sendValue);
      object?.sendMessage(sendValue, []);
    },
    [object]
  );

  const debouncedSendMessage = useDebouncedCallback(sendMessage, 250);

  useEffect(
    () =>
      object?.addEventListener(dh.Widget.EVENT_MESSAGE, event => {
        log.info('MJB event', event);
      }),
    [dh, object]
  );

  return (
    <TextField
      value={value}
      onChange={newValue => {
        setValue(newValue);
        debouncedSendMessage(newValue);
      }}
    />
  );
}

TextFieldObject.displayName = 'TextFieldObject';

export default TextFieldObject;
