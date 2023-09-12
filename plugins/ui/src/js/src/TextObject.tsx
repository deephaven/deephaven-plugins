import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import TextWidget from './TextWidget';

const log = Log.module('@deephaven/js-plugin-ui/TextObject');

export interface TextObjectProps {
  object: TextWidget;
}

function TextObject(props: TextObjectProps) {
  const { object } = props;
  // const dh = useApi();

  const value = useMemo(() => object.getDataAsString(), [object]);

  // TODO: This should be listening on the text object, right now we're just recreating every object
  // useEffect(
  //   () =>
  //     object?.addEventListener(dh.Widget.EVENT_MESSAGE, event => {
  //       log.info('MJB event', event);
  //     }),
  //   [dh, object]
  // );

  return (
    <div
      className="ui-text-object"
      style={{ position: 'relative', flexGrow: 1, flexShrink: 1 }}
    >
      <div style={{ fontSize: 'large' }}>{value}</div>
    </div>
  );
}

TextObject.displayName = 'TextObject';

export default TextObject;
