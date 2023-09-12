import React from 'react';
import type { Figure, Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import TableObject from './TableObject';
import FigureObject from './FigureObject';
import TextObject from './TextObject';
import TextFieldObject from './TextFieldObject';
import TextFieldWidget from './TextFieldWidget';
import Widget from './Widget';
import TextWidget from './TextWidget';

const log = Log.module('@deephaven/js-plugin-ui/ComponentObject');

export interface ComponentObjectProps {
  object: Table | Figure | Widget;
}

function isTable(object: unknown): object is Table {
  return (object as Table).getViewportData != null;
}

function isFigure(object: unknown): object is Figure {
  return (object as Figure).subscribe != null;
}

function ComponentObject(props: ComponentObjectProps) {
  const { object } = props;
  log.info('Object is', object);

  // TODO: Need a structured way to actually get the proper type from the server...
  if (isTable(object)) {
    return <TableObject object={object} />;
  }
  if (isFigure(object)) {
    return <FigureObject object={object} />;
  }

  switch (object.type) {
    case 'deephaven.ui.components.TextField':
      return <TextFieldObject object={object as TextFieldWidget} />;
    case 'deephaven.ui.components.Text':
      return <TextObject object={object as TextWidget} />;
    default:
      // TODO: Need to handle other types of objects registered by other plugins (e.g. Deephaven Express)
      log.warn('Unknown object type', object.type);
      return <div>Unknown object type: {object.type}</div>;
  }
}

ComponentObject.displayName = 'ComponentObject';

export default ComponentObject;
