import React, { useEffect, useState } from 'react';
import {
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { TableElementNode } from './TableElementUtils';

const log = Log.module('@deephaven/js-plugin-ui/TableElementView');

export interface TableElementViewProps {
  element: TableElementNode;
}

function TableElementView({ element }: TableElementViewProps) {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const { props: elementProps } = element;

  // Just load the object on mount
  useEffect(() => {
    async function loadModel() {
      log.debug('Loading table from props', element.props);
      const newTable = await element.props.table.fetch();
      const newModel = await IrisGridModelFactory.makeModel(dh, newTable);
      setModel(newModel);
    }
    loadModel();
  }, [dh, element]);

  return (
    // TODO: Use a `View` element here from React Spectrum, and set all the props appropriate
    <div className="ui-table-object">
      {model && (
        <IrisGrid
          model={model}
          onDataSelected={elementProps.onRowDoublePress}
        />
      )}
    </div>
  );
}

TableElementView.displayName = 'TableElementView';

export default TableElementView;
