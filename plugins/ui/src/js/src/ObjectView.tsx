import React, { useEffect, useState } from 'react';
import type { Figure, Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import TableObject from './TableObject';
import FigureObject from './FigureObject';
import { ExportedObject } from './ElementUtils';

const log = Log.module('@deephaven/js-plugin-ui/ObjectView');

export interface ObjectViewProps {
  object: ExportedObject;
}

function ObjectView(props: ObjectViewProps) {
  const { object } = props;
  const [widget, setWidget] = useState<unknown>();
  log.info('Object is', object);

  // Just load the object on mount
  useEffect(() => {
    async function loadWidget() {
      const newWidget = await object.fetch();
      setWidget(newWidget);
    }
    loadWidget();
  }, [object]);

  if (widget == null) {
    // Still loading
    return null;
  }

  switch (object.type) {
    case 'Table':
    case 'TreeTable':
    case 'HierarchicalTable':
      return <TableObject object={widget as Table} />;
    case 'Figure':
      return <FigureObject object={widget as Figure} />;
    default:
      // TODO: Need to handle other types of objects registered by other plugins (e.g. Deephaven Express)
      log.warn('Unknown object type', object.type);
      return <div>Unknown object type: {object.type}</div>;
  }
}

ObjectView.displayName = 'ObjectView';

export default ObjectView;
