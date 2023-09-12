import React, { useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import TextFieldWidget from './TextFieldWidget';

const log = Log.module('@deephaven/js-plugin-ui/TextFieldObject');

export interface TextFieldObjectProps {
  object: TextFieldWidget;
}

function TextFieldObject(props: TextFieldObjectProps) {
  const { object } = props;
  const dh = useApi();

  const [value, setValue] = useState(atob(object.getDataAsBase64()));

  useEffect(
    () =>
      object?.addEventListener(dh.Widget.EVENT_MESSAGE, event => {
        log.info('MJB event', event);
      }),
    [dh, object]
  );

  return (
    <div
      className="ui-text-input-object"
      style={{ position: 'relative', flexGrow: 0, flexShrink: 1 }}
    >
      <input
        type="text"
        value={value}
        className="form-control"
        onChange={event => {
          event.preventDefault();
          event.stopPropagation();

          const { value: newValue } = event.target;
          setValue(newValue);
          log.info('Sending message', newValue);
          object?.sendMessage(newValue, []);
        }}
      />
    </div>
  );
}

TextFieldObject.displayName = 'TextFieldObject';

export default TextFieldObject;
